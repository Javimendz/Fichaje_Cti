import { Injectable, Logger } from "@nestjs/common";
import { AlarmsService } from "./alarms.service";
import { Cron, CronExpression } from '@nestjs/schedule'; 
import { AlarmType } from "./entities/alarm.entity";
import { UserRole } from "auth/roles.enum";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "users/entities/user.entity";
import { Repository } from "typeorm";
import { Attendance } from "attendance/entities/attendance.entity";
import { DiaSemana } from "schedule/entities/distribucion-dia.entity";

@Injectable()
export class AlarmCronService {
  private readonly logger = new Logger('CronAlarmas');
  
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    private readonly alarmService: AlarmsService,
  ) {}

  //@Cron('*/10 * * * * *')
  @Cron(CronExpression.EVERY_30_MINUTES)
  async checkAbsencesBySchedule() {
    this.logger.log('--- Iniciando escaneo ---');

    const fechaActual = new Date();
    const hoyString = fechaActual.toLocaleDateString('en-CA'); 
    const inicioDelDia = new Date(hoyString);

    const mapeoDias: Record<number, DiaSemana> = {
      1: DiaSemana.LUNES,
      2: DiaSemana.MARTES,
      3: DiaSemana.MIERCOLES,
      4: DiaSemana.JUEVES,
      5: DiaSemana.VIERNES,
      6: DiaSemana.SABADO,
      0: DiaSemana.DOMINGO,
    };

    const diaEnumHoy = mapeoDias[fechaActual.getDay()];

    const trabajadores = await this.userRepository.find({
      where: { rol: UserRole.WORKER, isActive: true },
      relations: ['horario', 'horario.distribuciones', 'horario.distribuciones.franjas'] 
    });

    for (const worker of trabajadores) {
      if (!worker.horario?.distribuciones) {
        this.logger.debug(`[ID: ${worker.id}] Sin horario asignado.`);
        continue;
      }

      const distribucionHoy = worker.horario.distribuciones.find(d => d.diaSemana === diaEnumHoy);

      if (!distribucionHoy || !distribucionHoy.franjas || distribucionHoy.franjas.length === 0) {
        this.logger.debug(`[ID: ${worker.id}] Sin turno para hoy (${diaEnumHoy}).`);
        continue;
      }

      const primeraFranja = distribucionHoy.franjas[0];
      const horaEntradaHoy = primeraFranja.inicio; 

      if (!horaEntradaHoy) continue;

      // 🛡️ CAMBIO: Reducimos a 15 mins para forzar que salte la alarma AHORA
      const margenMinutos = 15; 
      const horaLimiteSuperada = this.haPasadoHoraLimite(horaEntradaHoy, margenMinutos);

      if (horaLimiteSuperada) {
        this.logger.log(`[ID: ${worker.id}] Hora límite superada. Verificando asistencia...`);
        
        const fichaje = await this.attendanceRepository.findOne({
          where: { usuarioId: worker.id, fechaJornada: hoyString },
        });

        if (fichaje) {
            this.logger.debug(`[ID: ${worker.id}] Asistencia registrada OK.`);
            continue;
        }

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
    const ahora = new Date();
    const minutosActuales = (ahora.getHours() * 60) + ahora.getMinutes();

    const partesHora = horaEntrada.split(':');
    const horasTeoricas = parseInt(partesHora[0], 10);
    const minutosTeoricos = parseInt(partesHora[1], 10);
    
    const minutosTotalesTeoricos = (horasTeoricas * 60) + (minutosTeoricos || 0);

    return minutosActuales > (minutosTotalesTeoricos + margenMinutos);
  }
}