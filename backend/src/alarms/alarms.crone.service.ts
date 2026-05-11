import { Injectable, Logger } from "@nestjs/common";
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from "@nestjs/typeorm";
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from "typeorm";

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isoWeek from 'dayjs/plugin/isoWeek';

import { UserRole } from "../auth/roles.enum";
import { User } from "../users/entities/user.entity";
import { Workday } from "../workday/entities/workday.entity";
import { Ausencia } from "../absence/entities/ausencia.entity";
import { AusenciaEstado } from '../absence/dto/ausencia-estado.enum'; 
import { AlarmType } from "./entities/alarm.entity";
import { AlarmsService } from "./alarms.service";
import { ScheduleService } from "../schedule/schedule.service";
import { WorkdayService } from "../workday/workday.service";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);

/**
 * Servicio de alarmas programadas que monitoriza ausencias y anomalías en fichajes.
 * * Este servicio utiliza tareas cron para ejecutar verificaciones periódicas del estado
 * de fichaje de los trabajadores, detectando incomparecencias y horas faltantes.
 */
@Injectable()
export class AlarmCronService {
  private readonly ZONA_HORARIA = 'Europe/Madrid';
  private readonly logger = new Logger('CronAlarmas');
  private appStarted = false;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Workday)
    private readonly workdayRepository: Repository<Workday>,
    private readonly alarmService: AlarmsService,
    @InjectRepository(Ausencia)
    private readonly ausenciaRepository: Repository<Ausencia>,
    private readonly scheduleService: ScheduleService,
    private readonly workdayService: WorkdayService,
  ) { }

  // =========================================================================
  // 1. ESCANEO CONTINUO DE ASISTENCIA (Incomparecencias)
  // =========================================================================
  
  /**
   * Se ejecuta cada 10 segundos.
   * Verifica si los trabajadores que debían entrar a trabajar lo han hecho.
   */
  @Cron('*/10 * * * * *')
  async checkAbsencesBySchedule() {
    this.logger.log('--- Iniciando escaneo de seguridad (Incomparecencias) ---');

    const ahora = dayjs().tz(this.ZONA_HORARIA);
    const inicioDelDia = ahora.startOf('day').toDate();
    const finDelDia = ahora.endOf('day').toDate();

    const trabajadores = await this.userRepository.find({
      where: { rol: UserRole.WORKER, isActive: true },
      relations: ['horario'] 
    });

    for (const worker of trabajadores) {
      if (!worker.empresaId) continue;

      // 🛡️ 1. ESCUDO DE AUSENCIAS
      const ausenciaAprobada = await this.ausenciaRepository.findOne({
        where: {
          usuario: { id: worker.id },
          estado: AusenciaEstado.APROBADA as any, 
          fechaInicio: LessThanOrEqual(ahora.toDate()) as any, 
          fechaFin: MoreThanOrEqual(ahora.toDate()) as any,
        }
      });

      if (ausenciaAprobada) {
        this.logger.debug(`[ID: ${worker.id}] Ignorando incomparecencia por ausencia aprobada: ${ausenciaAprobada.motivo || 'Vacaciones'}`);
        continue; 
      }

      // 📅 2. VERIFICAR TURNO DE HOY
      const turnoHoy = await this.scheduleService.getTurnoHoy(worker.id, ahora.toDate());
      
      if (!turnoHoy || !turnoHoy.franjas?.[0]) {
        continue;
      }

      const hEntradaTeorica = turnoHoy.franjas[0].inicio;

      // 🔎 3. BUSCAR FICHAJE (CHECK-IN)
      const fichaje = await this.workdayRepository.findOne({
        where: {
          usuario: { id: worker.id },
          inicio: Between(inicioDelDia, finDelDia)
        },
      });

      // 🚨 4. LÓGICA DE ALARMA: INCOMPARECENCIA
      if (!fichaje) {
        const margenMinutos = 15; 
        const horaLimiteSuperada = this.haPasadoHoraLimite(hEntradaTeorica, margenMinutos);

        if (horaLimiteSuperada) {
          const alarmaExistente = await this.alarmService.verificarAlarmaHoy(worker.id, AlarmType.ABSENCE);
          
          if (!alarmaExistente) {
            await this.alarmService.triggerAlarm(
              worker.id,
              worker.empresaId,
              AlarmType.ABSENCE,
              `INCOMPARECENCIA: Turno ${turnoHoy.semanaRotacion > 1 ? 'Rotativo ' : ''}debía entrar a las ${hEntradaTeorica} y no hay registro.`
            );
            this.logger.warn(`🚨 ALARMA ABSENCE creada para ID: ${worker.id}`);
          }
        }
      }
    }
    
    this.logger.log('--- Escaneo de seguridad completado ---');
  }

  // =========================================================================
  // 2. AUDITORÍA DE CIERRE DE PERIODOS (Semanal y Mensual)
  // =========================================================================

  /**
   * Cierre y auditoría de periodos.
   * Se ejecuta todos los días a las 23:55 hora de Madrid.
   * Si es domingo, audita la semana. Si es fin de mes, audita el mes.
   */
@Cron('55 23 * * *', { timeZone: 'Europe/Madrid' })
  async checkPeriodClosures() {
    const ahora = dayjs().tz(this.ZONA_HORARIA);
    const esDomingo = ahora.day() === 0;
    const esUltimoDiaMes = ahora.date() === ahora.daysInMonth();

    if (!esDomingo && !esUltimoDiaMes) return; 

    // Llamamos a la lógica real
    return await this.runAuditLogic(esDomingo, esUltimoDiaMes);
  }

  /**
   * 🚀 MÉTODO PARA TESTEO Y USO REAL
   * Separamos la lógica para poder forzarla manualmente
   */
  async runAuditLogic(forzarSemanal: boolean = false, forzarMensual: boolean = false) {
    this.logger.log(`Iniciando auditoría forzada: Semanal[${forzarSemanal}] Mensual[${forzarMensual}]`);

    const trabajadores = await this.userRepository.find({
      where: { rol: UserRole.WORKER, isActive: true },
    });

    for (const worker of trabajadores) {
      if (!worker.empresaId) continue;

      try {
        const resumen = await this.workdayService.getWorkSummary(
          worker.id,
          { id: worker.id, empresaId: worker.empresaId } as any
        );

        if (forzarSemanal) {
          await this.auditPeriod(worker, resumen.semana, 'SEMANALES', AlarmType.WEEKLY_HOURS_INCOMPLETE);
        }

        if (forzarMensual) {
          await this.auditPeriod(worker, resumen.mes, 'MENSUALES', AlarmType.MONTHLY_HOURS_INCOMPLETE);
        }
      } catch (error: any) {
        this.logger.error(`Error en auditoría Worker ${worker.id}: ${error.message}`);
      }
    }
  }


  // =========================================================================
  // MÉTODOS AUXILIARES 
  // =========================================================================

  /**
   * Función auxiliar para procesar el incumplimiento
   */
  private async auditPeriod(worker: User, datosPeriodo: any, label: string, tipo: AlarmType) {
    const trabajado = datosPeriodo.trabajado.segundos;
    const objetivo = datosPeriodo.objetivoTotal.segundos;

    if (objetivo <= 0) return;

    if (trabajado < objetivo) {
      const yaExiste = await this.alarmService.verificarAlarmaHoy(worker.id, tipo);
      
      if (!yaExiste) {
        const faltantes = this.segundosAHoras(objetivo - trabajado);
        const descripcion = `HORAS ${label} INCOMPLETAS: Ha trabajado ${datosPeriodo.trabajado.formateado} de ${datosPeriodo.objetivoTotal.formateado}. Faltan ${faltantes}.`;

        await this.alarmService.triggerAlarm(
          worker.id,
          worker.empresaId,
          tipo,
          descripcion
        );

        this.logger.warn(`🚨 Alarma ${tipo} generada para Worker ID: ${worker.id}`);
      }
    }
  }

  private haPasadoHoraLimite(horaEntrada: string, margenMinutos: number): boolean {
    const ahora = dayjs().tz(this.ZONA_HORARIA);
    const minutosActuales = ahora.hour() * 60 + ahora.minute();

    const [h, m] = horaEntrada.split(':').map(Number);
    const minutosTeoricos = h * 60 + m;

    return minutosActuales > minutosTeoricos + margenMinutos;
  }

  private haSalidoAntesDeTiempo(fechaFinReal: Date, horaFinTeorica: string): boolean {
    const finReal = dayjs(fechaFinReal).tz(this.ZONA_HORARIA);
    const minReales = (finReal.hour() * 60) + finReal.minute();

    const [horas, minutos] = horaFinTeorica.split(':').map(Number);
    const minTeoricos = (horas * 60) + (minutos || 0);
    
    this.logger.verbose(`Minutos Reales: ${minReales} | Minutos Teóricos: ${minTeoricos}`);
    return minReales < minTeoricos;
  }

  private segundosAHoras(segundos: number): string {
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    return `${h}h ${m}m`;
  }
}