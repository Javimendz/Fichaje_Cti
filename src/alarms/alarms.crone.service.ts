import { Injectable, Logger } from "@nestjs/common";
import { AlarmsService } from "./alarms.service";
import { Cron, CronExpression } from '@nestjs/schedule'; 
import { AlarmType } from "./entities/alarm.entity";
import { UserRole } from "auth/roles.enum";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "users/entities/user.entity";
import { Between, Repository } from "typeorm";
import { DiaSemana } from "schedule/entities/distribucion-dia.entity";
import { Leave, LeaveStatus } from '../leaves/entities/leaf.entity';
import { Workday } from "workday/entities/workday.entity";

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class AlarmCronService {
  private readonly ZONA_HORARIA = 'Europe/Madrid';
  private readonly logger = new Logger('CronAlarmas');
  
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Workday)
    private readonly workdayRepository: Repository<Workday>,
    private readonly alarmService: AlarmsService,
    @InjectRepository(Leave)
    private readonly leaveRepository: Repository<Leave>
  ) {}

  @Cron('*/10 * * * * *')
  //@Cron(CronExpression.EVERY_30_MINUTES)
  async checkAbsencesBySchedule() {
    this.logger.log('--- Iniciando escaneo ---');

   const ahora = dayjs().tz(this.ZONA_HORARIA);
  const hoyString = ahora.format('YYYY-MM-DD'); 

  // Rango de horas EXACTO para buscar la jornada de HOY
  const inicioDelDia = ahora.startOf('day').toDate();
  const finDelDia = ahora.endOf('day').toDate();

  const mapeoDias: Record<number, DiaSemana> = {
    1: DiaSemana.LUNES, 2: DiaSemana.MARTES, 3: DiaSemana.MIERCOLES,
    4: DiaSemana.JUEVES, 5: DiaSemana.VIERNES, 6: DiaSemana.SABADO, 0: DiaSemana.DOMINGO,
  };
  const diaEnumHoy = mapeoDias[ahora.day()];

    const trabajadores = await this.userRepository.find({
      where: { rol: UserRole.WORKER, isActive: true },
      relations: ['horario', 'horario.distribuciones', 'horario.distribuciones.franjas'] 
    });

    for (const worker of trabajadores) {
      // 1. Verificamos Permisos (Vacaciones/Bajas)
      const tienePermiso = await this.leaveRepository.findOne({
        where: {
          usuarioId: worker.id,
          fecha: hoyString,
          estado: LeaveStatus.APPROVED
        }
      });

      if (tienePermiso) {
        this.logger.debug(`[ID: ${worker.id}] No se genera alarma: tiene permiso (${tienePermiso.tipo}).`);
        continue;
      }

      // 2. Verificación de Horario
      if (!worker.horario?.distribuciones) {
        this.logger.debug(`[ID: ${worker.id}] Sin horario asignado.`);
        continue;
      }

      const distribucionHoy = worker.horario.distribuciones.find(d => d.diaSemana === diaEnumHoy);
      if (!distribucionHoy || !distribucionHoy.franjas || distribucionHoy.franjas.length === 0) {
        this.logger.debug(`[ID: ${worker.id}] Sin turno para hoy (${diaEnumHoy}).`);
        continue;
      }

      const horaEntradaHoy = distribucionHoy.franjas[0].inicio; 
      if (!horaEntradaHoy) continue;

      // 3. Verificación de Límite de Tiempo
      const margenMinutos = 15; 
      const horaLimiteSuperada = this.haPasadoHoraLimite(horaEntradaHoy, margenMinutos);

      if (horaLimiteSuperada) {
        this.logger.log(`[ID: ${worker.id}] Hora límite superada. Verificando asistencia...`);
        
        // 🛡️ CAMBIO: Buscamos si tiene una Jornada abierta o cerrada hoy
        const fichaje = await this.workdayRepository.findOne({
          where: { 
            usuario: { id: worker.id }, 
            inicio: Between(inicioDelDia, finDelDia) // Buscamos cualquier jornada iniciada hoy
          },
        });

        if (fichaje) {
            this.logger.debug(`[ID: ${worker.id}] Asistencia registrada OK (Tiene jornada).`);
            continue;
        }

        // 4. Creación de Alarma si no ha fichado
        const alarmaExistente = await this.alarmService.verificarAlarmaHoy(worker.id, AlarmType.ABSENCE, inicioDelDia);

        if (!alarmaExistente) {
          await this.alarmService.triggerAlarm(
            worker.id,
            worker.empresaId,
            AlarmType.ABSENCE,
            `INCOMPARECENCIA: Debía entrar a las ${horaEntradaHoy} (Día: ${diaEnumHoy}) y no ha fichado.`
          );
          this.logger.warn(`🚨 ALARMA CREADA para ID: ${worker.id}`);
        } else {
             this.logger.debug(`[ID: ${worker.id}] Alarma ya notificada hoy.`);
        }
      } else {
          this.logger.debug(`[ID: ${worker.id}] Aún dentro del margen de cortesía.`);
      }
    }
    this.logger.log('--- Escaneo completado ---');
  }
  
 
  
  private haPasadoHoraLimite(horaEntrada: string, margenMinutos: number): boolean {
  // Obtenemos la hora actual FORZADA a la zona horaria correcta
  const ahora = dayjs().tz(this.ZONA_HORARIA);
  
  // Dayjs usa .hour() y .minute()
  const minutosActuales = (ahora.hour() * 60) + ahora.minute();

  const partesHora = horaEntrada.split(':');
  const horasTeoricas = parseInt(partesHora[0], 10);
  const minutosTeoricos = parseInt(partesHora[1], 10);
  
  const minutosTotalesTeoricos = (horasTeoricas * 60) + (minutosTeoricos || 0);

  return minutosActuales > (minutosTotalesTeoricos + margenMinutos);
}


  
}