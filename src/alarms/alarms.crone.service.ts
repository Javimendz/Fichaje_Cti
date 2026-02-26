import { Injectable, Logger } from "@nestjs/common";
import { AlarmsService } from "./alarms.service";
import { Cron } from '@nestjs/schedule';
import { UserRole } from "auth/roles.enum";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "users/entities/user.entity";
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from "typeorm";
import { DiaSemana } from "schedule/entities/distribucion-dia.entity";
import { Workday } from "workday/entities/workday.entity";

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { AusenciaEstado } from "absence/dto/ausencia-estado.enum";
import { Ausencia } from "absence/entities/ausencia.entity";
import { AlarmType } from "./entities/alarm.entity";

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
    @InjectRepository(Ausencia)
    private readonly ausenciaRepository: Repository<Ausencia>
  ) { }


  //@Cron(CronExpression.EVERY_30_MINUTES)
  @Cron('*/10 * * * * *')
  async checkAbsencesBySchedule() {
    this.logger.log('--- Iniciando escaneo de seguridad ---');

    const ahora = dayjs().tz(this.ZONA_HORARIA);
    const hoyString = ahora.format('YYYY-MM-DD');

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
      // 1. ESCUDO DE AUSENCIAS (Evita alarmas si tiene vacaciones/bajas aprobadas)
      const tieneAusencia = await this.ausenciaRepository.findOne({
        where: {
          usuarioId: worker.id,
          estado: AusenciaEstado.APROBADA,
          fechaInicio: LessThanOrEqual(hoyString),
          fechaFin: MoreThanOrEqual(hoyString)
        }
      });

      if (tieneAusencia) {
        this.logger.debug(`[ID: ${worker.id}] Ignorado: tiene permiso (${tieneAusencia.tipo}).`);
        continue;
      }

      // 2. OBTENER HORARIO DE HOY
      const distribucionHoy = worker.horario?.distribuciones?.find(d => d.diaSemana === diaEnumHoy);
      if (!distribucionHoy || !distribucionHoy.franjas || distribucionHoy.franjas.length === 0) {
        this.logger.debug(`[ID: ${worker.id}] Sin turno para hoy.`);
        continue;
      }

      const hEntradaTeorica = distribucionHoy.franjas[0].inicio;
      const hSalidaTeorica = distribucionHoy.franjas[0].fin; // 👈 Necesitamos la salida teórica

      if (!hEntradaTeorica || !hSalidaTeorica) continue;

      // 3. BUSCAR Fichaje de hoy (¡UNA SOLA VEZ para no saturar la BD!)
      const fichaje = await this.workdayRepository.findOne({
        where: {
          usuario: { id: worker.id },
          inicio: Between(inicioDelDia, finDelDia)
        },
      });

      // --- LÓGICA A: INCOMPARECENCIA (NO ha fichado entrada) ---
      if (!fichaje) {

        const margenMinutos = 15;
        const horaLimiteSuperada = this.haPasadoHoraLimite(hEntradaTeorica, margenMinutos);

        if (horaLimiteSuperada) {
          const alarmaExistente = await this.alarmService.verificarAlarmaHoy(worker.id, AlarmType.ABSENCE, inicioDelDia);

          if (!alarmaExistente) {
            await this.alarmService.triggerAlarm(
              worker.id,
              worker.empresaId,
              AlarmType.ABSENCE,
              `INCOMPARECENCIA: Debía entrar a las ${hEntradaTeorica} y no ha fichado.`
            );
            this.logger.warn(`🚨 ALARMA ABSENCE creada para ID: ${worker.id}`);
          }
        }
        // Si no ha fichado entrada, no puede haber salido antes de tiempo. Saltamos al siguiente trabajador.
        continue;
      }

      // --- LÓGICA B: SALIDA ANTICIPADA (SÍ ha fichado entrada Y salida) ---
      if (fichaje.fin) {
        this.logger.debug(`[ID: ${worker.id}] Evaluando salida. Fin BD: ${fichaje.fin}, Teórica: ${hSalidaTeorica}`);
        const salioAntes = this.haSalidoAntesDeTiempo(fichaje.fin, hSalidaTeorica);

        if (salioAntes) {
          this.logger.debug(`[ID: ${worker.id}] ¡Se detectó salida antes de tiempo!`);
          const alarmaExistente = await this.alarmService.verificarAlarmaHoy(worker.id, AlarmType.EARLY_DEPARTURE, inicioDelDia);

          if (!alarmaExistente) {
            // Formateamos la hora real de salida a formato legible HH:mm
            const hSalidaReal = dayjs(fichaje.fin).tz(this.ZONA_HORARIA).format('HH:mm');

            await this.alarmService.triggerAlarm(
              worker.id,
              worker.empresaId,
              AlarmType.EARLY_DEPARTURE,
              `SALIDA ANTICIPADA: Fichó salida a las ${hSalidaReal} (Debía salir a las ${hSalidaTeorica}).`
            );
            this.logger.warn(`🚨 ALARMA SALIDA ANTICIPADA creada para ID: ${worker.id}`);
          }
        }
      }
    }
    this.logger.log('--- Escaneo completado ---');
  }

  // =========================================================================
  // MÉTODOS AUXILIARES (Deben estar fuera del Cron, pero dentro de la clase)
  // =========================================================================

  private haPasadoHoraLimite(horaEntrada: string, margenMinutos: number): boolean {
    const ahora = dayjs().tz(this.ZONA_HORARIA);
    const minutosActuales = (ahora.hour() * 60) + ahora.minute();

    const partesHora = horaEntrada.split(':');
    const horasTeoricas = parseInt(partesHora[0], 10);
    const minutosTeoricos = parseInt(partesHora[1], 10);

    const minutosTotalesTeoricos = (horasTeoricas * 60) + (minutosTeoricos || 0);

    return minutosActuales > (minutosTotalesTeoricos + margenMinutos);
  }

  private haSalidoAntesDeTiempo(fechaFinReal: Date, horaFinTeorica: string): boolean {
    // 1. Convertimos la hora de la BD a la zona horaria correcta
    const finReal = dayjs(fechaFinReal).tz(this.ZONA_HORARIA);
    const minReales = (finReal.hour() * 60) + finReal.minute();

    // 2. Convertimos el string '18:00' a minutos totales del día
    const [horas, minutos] = horaFinTeorica.split(':').map(Number);
    const minTeoricos = (horas * 60) + (minutos || 0);
    this.logger.verbose(`Minutos Reales: ${minReales} | Minutos Teóricos: ${minTeoricos}`);
    // 3. Si fichó a las 17:50 (1070 min) y debía salir a las 18:00 (1080 min) -> true
    return minReales < minTeoricos;
  }







}