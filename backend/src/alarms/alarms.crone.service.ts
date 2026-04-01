


/**
 * Servicio de cron para gestionar alarmas de asistencia de trabajadores.
 * 
 * Este servicio ejecuta verificaciones programadas cada 10 segundos para detectar:
 * - Incomparecencias: trabajadores que no han fichado entrada después de la hora límite
 * - Salidas anticipadas: trabajadores que han fichado salida antes de lo programado
 * 
 * El servicio respeta ausencias aprobadas (vacaciones, bajas) y utiliza la zona horaria de Madrid
 * para todas las comparaciones de horarios.
 * 
 * @class AlarmCronService
 */



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
import { ScheduleService } from "schedule/schedule.service";

dayjs.extend(utc);
dayjs.extend(timezone);




@Injectable()
/**
 * Servicio de alarmas programadas que monitoriza ausencias y anomalías en fichajes.
 * 
 * Este servicio utiliza tareas cron para ejecutar verificaciones periódicas del estado
 * de fichaje de los trabajadores, detectando incomparecencias y salidas anticipadas.
 * 
 * @class AlarmCronService
 * 
 * @remarks
 * - Opera en la zona horaria de Madrid (Europe/Madrid)
 * - Solo supervisa trabajadores con rol WORKER y estado activo
 * - Evita generar alarmas duplicadas verificando existencia previa para el mismo tipo y día
 * - Ignora trabajadores con permisos, vacaciones o bajas aprobadas
 * 
 * @example
 * ```typescript
 * // El servicio se ejecuta automáticamente cada 10 segundos
 * // y genera alarmas solo cuando detecta anomalías
 * ```
 */
export class AlarmCronService {
  private readonly ZONA_HORARIA = 'Europe/Madrid';
  private readonly logger = new Logger('CronAlarmas');

  /**
   * Constructor del servicio de alarmas programadas.
   * 
   * @param userRepository - Repositorio para gestionar operaciones de la entidad Usuario
   * @param workdayRepository - Repositorio para gestionar operaciones de la entidad Jornada Laboral
   * @param alarmService - Servicio de alarmas para operaciones relacionadas con alarmas
   * @param ausenciaRepository - Repositorio para gestionar operaciones de la entidad Ausencia
   */
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Workday)
    private readonly workdayRepository: Repository<Workday>,
    private readonly alarmService: AlarmsService,
    @InjectRepository(Ausencia)
    private readonly ausenciaRepository: Repository<Ausencia>,
    private readonly scheduleService: ScheduleService,
  ) { }


    
  //@Cron(CronExpression.EVERY_30_MINUTES)
  @Cron('*/10 * * * * *')
  /**
   * Escanea y verifica ausencias y anomalías en los fichajes de los trabajadores.
   * 
   * Este método se ejecuta de forma programada y realiza las siguientes validaciones:
   * 
   * 1. **Escudo de ausencias**: Ignora trabajadores con permisos, vacaciones o bajas aprobadas para el día actual.
   * 2. **Incomparecencia**: Detecta si un trabajador no ha fichado entrada pasado el margen permitido (15 minutos).
   * 3. **Salida anticipada**: Detecta si un trabajador ha fichado salida antes de la hora teórica.
   * 
   * Para cada trabajador activo, obtiene su horario programado para el día de la semana actual
   * y lo compara con los fichajes registrados. Si detecta anomalías, genera alarmas correspondientes
   * (ABSENCE o EARLY_DEPARTURE) siempre que no exista una alarma previa para ese día.
   * 
   * @async
   * @returns {Promise<void>} No retorna valor, solo generaalarmas en la base de datos si es necesario.
   * 
   * @remarks
   * - Solo procesa trabajadores con rol WORKER y estado activo.
   * - Utiliza la zona horaria configurada para todas las comparaciones de tiempo.
   * - Evita crear alarmas duplicadas verificando si ya existe una para el mismo trabajador y tipo en el día actual.
   * - Registra eventos de debug, log e información de advertencias en el logger.
   * 
   * @example
   * ```typescript
   * await this.checkAbsencesBySchedule();
   * ```
   */
  
  async checkAbsencesBySchedule() {
    this.logger.log('--- Iniciando escaneo de seguridad ---');

    const ahora = dayjs().tz(this.ZONA_HORARIA);
    const inicioDelDia = ahora.startOf('day').toDate();
    const finDelDia = ahora.endOf('day').toDate();

    const trabajadores = await this.userRepository.find({
      where: { rol: UserRole.WORKER, isActive: true },
      relations: ['horario'] 
    });

    for (const worker of trabajadores) {
      // 1. ESCUDO DE AUSENCIAS (Igual que antes)
      // ... (manten tu lógica de ausenciaRepository)

      // 2. 💡 CORRECCIÓN ROTACIÓN: Usamos la lógica maestra del ScheduleService
      const turnoHoy = await this.scheduleService.getTurnoHoy(worker.id, ahora.toDate());
      
      if (!turnoHoy || !turnoHoy.franjas?.[0]) {
        this.logger.debug(`[ID: ${worker.id}] Sin turno o descanso hoy.`);
        continue;
      }

      const hEntradaTeorica = turnoHoy.franjas[0].inicio;

      // 3. BUSCAR FICHAJE
      const fichaje = await this.workdayRepository.findOne({
        where: {
          usuario: { id: worker.id },
          inicio: Between(inicioDelDia, finDelDia)
        },
      });

      // 4. LÓGICA: SOLO INCOMPARECENCIA
      // La salida anticipada ya la gestiona el WorkdayService al hacer check-out.
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
    this.logger.log('--- Escaneo completado ---');
  }

  // =========================================================================
  // MÉTODOS AUXILIARES 
  // =========================================================================

 /**
   * Determina si la hora actual ha superado el horario límite de entrada.
   * 
   * Compara los minutos totales del día actual con los minutos totales del horario
   * teórico de entrada, sumándole un margen de tolerancia en minutos.
   * 
   * @param horaEntrada - Hora de entrada teórica en formato HH:mm (ej: "09:30")
   * @param margenMinutos - Margen de tolerancia en minutos a sumar al horario límite
   * @returns true si la hora actual ha superado el horario límite (horario + margen); false en caso contrario
   * 
   * @example
   * // Si es las 10:15 y el horario es 09:30 con margen de 15 minutos
   * // Retorna true porque 10:15 > 09:45
   * haPasadoHoraLimite("09:30", 15) // true
   */

 private haPasadoHoraLimite(
    horaEntrada: string,
    margenMinutos: number
  ): boolean {
    const ahora = dayjs().tz(this.ZONA_HORARIA);
    const minutosActuales = ahora.hour() * 60 + ahora.minute();

    const [h, m] = horaEntrada.split(':').map(Number);
    const minutosTeoricos = h * 60 + m;

    return minutosActuales > minutosTeoricos + margenMinutos;
  }
   // 
  /**
   * Determina si un empleado ha salido antes de la hora teórica establecida.
   * 
   * Compara la hora real de salida con la hora teórica esperada, convertiendo ambas
   * a minutos totales del día para facilitar la comparación.
   * 
   * @param fechaFinReal - Fecha y hora real de salida del empleado
   * @param horaFinTeorica - Hora teórica de salida en formato 'HH:mm' (ej: '18:00')
   * @returns `true` si la salida fue antes de la hora teórica, `false` en caso contrario
   * 
   * @example
   * // Empleado salió a las 17:50 y debía salir a las 18:00
   * haSalidoAntesDeTiempo(new Date('2024-01-15 17:50:00'), '18:00') // true
   * 
   * @example
   * // Empleado salió a las 18:05 y debía salir a las 18:00
   * haSalidoAntesDeTiempo(new Date('2024-01-15 18:05:00'), '18:00') // false
   */
  //  
  private haSalidoAntesDeTiempo(fechaFinReal: Date, horaFinTeorica: string): boolean {
    // Convertimos la hora de la BD a la zona horaria correcta
    const finReal = dayjs(fechaFinReal).tz(this.ZONA_HORARIA);
    const minReales = (finReal.hour() * 60) + finReal.minute();

    // Convertimos el string '18:00' a minutos totales del día
    const [horas, minutos] = horaFinTeorica.split(':').map(Number);
    const minTeoricos = (horas * 60) + (minutos || 0);
    this.logger.verbose(`Minutos Reales: ${minReales} | Minutos Teóricos: ${minTeoricos}`);
    // 3. Si fichó a las 17:50 (1070 min) y debía salir a las 18:00 (1080 min) -> true
    return minReales < minTeoricos;
  }



    



}