import { Injectable, BadRequestException, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Between, Not } from 'typeorm';
import { Workday } from './entities/workday.entity';
import { CheckInDto } from './dto/check-in.dto';
import type { UserPayload } from 'auth/interfaces/user-payload.interface';
import { AlarmsService } from 'alarms/alarms.service';
import { AlarmType } from 'alarms/entities/alarm.entity';
import { User } from 'users/entities/user.entity';
import { ScheduleService } from 'schedule/schedule.service'; 
import { DateTime, Duration } from 'luxon';
const Holidays = require('date-holidays');

// Imports de Dayjs
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);

@Injectable()
export class WorkdayService {
  private readonly logger = new Logger('WorkdayService');
  private readonly TIMEZONE = 'Europe/Madrid';

  constructor(
    @InjectRepository(Workday) private readonly workdayRepository: Repository<Workday>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly alarmService: AlarmsService,
    @Inject(forwardRef(() => ScheduleService))
    private readonly scheduleService: ScheduleService,
  ) { }

  // ============================================
  // 1. INICIAR JORNADA (Check-In)
  // ============================================
  async checkIn(dto: CheckInDto, userPayload: UserPayload) {
    if (!userPayload.empresaId) throw new BadRequestException('No tienes empresa asignada.');

    const activeWorkday = await this.workdayRepository.findOne({
      where: { usuario: { id: userPayload.id }, fin: IsNull() }
    });

    if (activeWorkday) throw new BadRequestException('Ya tienes una jornada activa.');

    const usuarioDB = await this.userRepository.findOne({
      where: { id: userPayload.id },
      relations: ['empresa'] 
    });

    if (!usuarioDB) throw new BadRequestException('Usuario no encontrado.');

    // --- Geofencing ---
    const latEmpresa = Number(usuarioDB.empresa?.latitud);
    const lngEmpresa = Number(usuarioDB.empresa?.longitud);
    const radioConfig = Number(process.env.MAX_FICHAR_DISTANCE) || 600;
    const radioPermitido = Number(usuarioDB.empresa?.radioPermitido || radioConfig);

    if (dto.latitud && dto.longitud && latEmpresa && lngEmpresa) {
      const distancia = this.calcularDistancia(Number(dto.latitud), Number(dto.longitud), latEmpresa, lngEmpresa);
      this.logger.log(`📍 Fichaje ID:${userPayload.id} - Distancia a la sede: ${distancia.toFixed(2)}m (Radio: ${radioPermitido}m)`);

      if (distancia > radioPermitido) {
        await this.alarmService.triggerAlarm(
          userPayload.id, userPayload.empresaId, AlarmType.UNAUTHORIZED_ZONE,
          `ZONA NO AUTORIZADA: Fichaje a ${distancia.toFixed(0)}m de la oficina (Radio máx: ${radioPermitido}m).`
        );
      }
    } else {
      this.logger.warn(`⚠️ [ID:${userPayload.id}] Geofencing omitido: Faltan coordenadas del usuario o empresa.`);
    }

    const ahora = new Date();
    const newWorkday = this.workdayRepository.create({
      inicio: ahora,
      latitudEntrada: dto.latitud,
      longitudEntrada: dto.longitud,
      presente: dto.presente,
      tipo: 'Entrada',
      usuario: { id: userPayload.id },
      empresa: { id: userPayload.empresaId }
    });

    const savedWorkday = await this.workdayRepository.save(newWorkday);

    await this.alarmService.resolverAlarmasPrevias(userPayload.id, [AlarmType.ABSENCE]);

    // Validación de Retraso
    const turnoHoy = await this.scheduleService.getTurnoHoy(userPayload.id, ahora);

    if (turnoHoy?.franjas?.[0]?.inicio) {
      const esTarde = this.comprobarRetraso(ahora, turnoHoy.franjas[0].inicio, 10);
      if (esTarde) {
        await this.alarmService.triggerAlarm(
          userPayload.id, userPayload.empresaId, AlarmType.LATE_ARRIVAL,
          `RETRASO: Entrada a las ${ahora.toLocaleTimeString('en-GB')} (Turno Teórico: ${turnoHoy.franjas[0].inicio}).`
        );
      }
    }

    return savedWorkday;
  }

  // ============================================
  // 2. FINALIZAR JORNADA (Check-Out)
  // ============================================
  async checkOut(dto: CheckInDto, userPayload: UserPayload) {
    const jornada = await this.findActiveWorkday(userPayload.id);
    if (!jornada) throw new BadRequestException('No hay jornada activa.');

    const ahora = new Date();
    
    // --- 🚨 NUEVO: ALARMA DE SALIDA ANTICIPADA ---
    const turnoHoy = await this.scheduleService.getTurnoHoy(userPayload.id, ahora);
    if (turnoHoy?.franjas?.[0]?.fin) {
      const horaFinTeorica = turnoHoy.franjas[0].fin;
      
      // Reutilizamos la lógica: convertimos a minutos para comparar
      const finRealMin = (ahora.getHours() * 60) + ahora.getMinutes();
      const [h, m] = horaFinTeorica.split(':').map(Number);
      const finTeoricoMin = (h * 60) + m;

      // Si sale al menos 10 minutos antes de su hora...
      if (finRealMin < (finTeoricoMin - 10)) {
        await this.alarmService.triggerAlarm(
          userPayload.id, 
          userPayload.empresaId, 
          AlarmType.EARLY_DEPARTURE,
          `SALIDA ANTICIPADA: Ha salido a las ${ahora.toLocaleTimeString('en-GB', {timeZone: this.TIMEZONE})} (Debía salir a las ${horaFinTeorica}).`
        );
      }
    }
    // ----------------------------------------------

    jornada.fin = ahora;
    if (dto.latitud && dto.longitud) {
      jornada.latitudSalida = dto.latitud;
      jornada.longitudSalida = dto.longitud;
    }

    jornada.total_segundos = Math.floor((ahora.getTime() - jornada.inicio.getTime()) / 1000);
    jornada.tipo = 'Salida';
    jornada.presente = dto.presente;

    return await this.workdayRepository.save(jornada);
  }

  // ============================================
  // 3. GENERACIÓN DE RESÚMENES (Work Summary)
  // ============================================
  async getWorkSummary(id: number, user: UserPayload) {
    const ahora = DateTime.now().setZone(this.TIMEZONE);

    const inicioHoy = ahora.startOf('day');
    const inicioSemana = ahora.startOf('week'); 
    const finSemana = ahora.endOf('week');
    const inicioMes = ahora.startOf('month');
    const finMes = ahora.endOf('month');

    const [
      mensualDB, semanalDB, hoyDB, activa, turnoHoy,
      teoricoSemanaHastaHoy, teoricoMesHastaHoy,
      teoricoSemanaCompleta, teoricoMesCompleto
    ] = await Promise.all([
      this.getTotalRangeDB(id, inicioMes.toJSDate(), finMes.toJSDate()),
      this.getTotalRangeDB(id, inicioSemana.toJSDate(), ahora.toJSDate()),
      this.getTotalRangeDB(id, inicioHoy.toJSDate(), ahora.toJSDate()),
      this.findActiveWorkday(id),
      this.scheduleService.getTurnoHoy(id, ahora.toJSDate()),
      this.scheduleService.getTeoricoRange(id, inicioSemana.toJSDate(), ahora.toJSDate()),
      this.scheduleService.getTeoricoRange(id, inicioMes.toJSDate(), ahora.toJSDate()),
      this.scheduleService.getTeoricoRange(id, inicioSemana.toJSDate(), finSemana.toJSDate()),
      this.scheduleService.getTeoricoRange(id, inicioMes.toJSDate(), finMes.toJSDate())
    ]);

    // --- CORRECCIÓN: Tiempo en vivo troceado por periodos ---
    let segundosEnVivoHoy = 0;
    let segundosEnVivoSemana = 0;
    let segundosEnVivoMes = 0;

    if (activa) {
      const inicioActiva = DateTime.fromJSDate(activa.inicio).setZone(this.TIMEZONE);

      // 1. ¿Cuánto de este turno pertenece a HOY?
      const inicioParaHoy = inicioActiva > inicioHoy ? inicioActiva : inicioHoy;
      segundosEnVivoHoy = Math.floor(ahora.diff(inicioParaHoy, 'seconds').seconds);

      // 2. ¿Cuánto de este turno pertenece a ESTA SEMANA?
      const inicioParaSemana = inicioActiva > inicioSemana ? inicioActiva : inicioSemana;
      segundosEnVivoSemana = Math.floor(ahora.diff(inicioParaSemana, 'seconds').seconds);

      // 3. ¿Cuánto de este turno pertenece a ESTE MES?
      const inicioParaMes = inicioActiva > inicioMes ? inicioActiva : inicioMes;
      segundosEnVivoMes = Math.floor(ahora.diff(inicioParaMes, 'seconds').seconds);
    }

    const totalHoy = hoyDB + Math.max(0, segundosEnVivoHoy);
    const totalSemana = semanalDB + Math.max(0, segundosEnVivoSemana);
    const totalMes = mensualDB + Math.max(0, segundosEnVivoMes);
    // --------------------------------------------------------

    let segundosTeoricosHoy = 0;
    if (turnoHoy?.franjas) {
      segundosTeoricosHoy = turnoHoy.franjas.reduce((acc, f) => {
        return (f.inicio && f.fin) ? acc + this.calcularSegundosFranja(f.inicio, f.fin) : acc;
      }, 0);
    }

    return {
      hoy: {
        ...this.formatPeriod(totalHoy, segundosTeoricosHoy),
        objetivoTotal: { 
          segundos: segundosTeoricosHoy, 
          formateado: this.convertirSegundosAHora(segundosTeoricosHoy) 
        }
      },
      semana: {
        ...this.formatPeriod(totalSemana, teoricoSemanaHastaHoy),
        objetivoTotal: { 
          segundos: teoricoSemanaCompleta, 
          formateado: this.convertirSegundosAHora(teoricoSemanaCompleta) 
        }
      },
      mes: {
        ...this.formatPeriod(totalMes, teoricoMesHastaHoy),
        objetivoTotal: { 
          segundos: teoricoMesCompleto, 
          formateado: this.convertirSegundosAHora(teoricoMesCompleto) 
        }
      },
      isWorking: !!activa,
      puesto: (turnoHoy as any)?.nombre || 'Sin turno asignado',
      lastUpdate: ahora.toISO() 
    };
  }

  // ============================================
  // MÉTODOS DE HISTORIAL Y STATUS
  // ============================================
  async findActiveWorkday(usuarioId: number): Promise<Workday | null> {
    return await this.workdayRepository.findOne({
      where: { usuario: { id: usuarioId }, fin: IsNull() }
    });
  }

  async getHistory(usuarioId: number) {
    return await this.workdayRepository.find({
      where: { usuario: { id: usuarioId } },
      order: { inicio: 'DESC' }
    });
  }

  async findAllByRange(usuarioId: number, desde: Date, hasta: Date) {
    const fechaFin = new Date(hasta);
    fechaFin.setHours(23, 59, 59, 999);
    const fechaInicio = new Date(desde);
    fechaInicio.setHours(0, 0, 0, 0);

    return await this.workdayRepository.find({
      where: { usuario: { id: usuarioId }, inicio: Between(fechaInicio, fechaFin) },
      order: { inicio: 'DESC' },
      relations: ['empresa'],
      select: {
        id: true, inicio: true, fin: true, total_segundos: true,
        latitudEntrada: true, longitudEntrada: true,
        latitudSalida: true, longitudSalida: true, modalidad: true,
        empresa: { id: true, nombre: true }
      }
    });
  }

  async getTodayStats(empresaId: number) {
    const inicioDia = new Date();
    inicioDia.setHours(0, 0, 0, 0);
    const finDia = new Date();
    finDia.setHours(23, 59, 59, 999);

    const activos = await this.workdayRepository.count({
      where: { empresa: { id: empresaId }, fin: IsNull(), inicio: Between(inicioDia, finDia) }
    });

    const terminados = await this.workdayRepository.count({
      where: { empresa: { id: empresaId }, fin: Not(IsNull()), inicio: Between(inicioDia, finDia) }
    });

    const alarmasCriticas = await this.alarmService.countPendingToday(empresaId);

    return {
      fecha: inicioDia.toLocaleDateString('es-ES'),
      stats: { trabajandoAhora: activos, jornadasFinalizadas: terminados, alertasPendientes: alarmasCriticas }
    };
  }

  async getWorkerSummaryForAdmin(workerId: number, adminEmpresaId: number) {
    const worker = await this.userRepository.findOne({
      where: { id: workerId },
      relations: ['empresa']
    });

    if (!worker) throw new NotFoundException('Trabajador no encontrado.');
    if (worker.empresa?.id !== adminEmpresaId) {
      throw new BadRequestException('No tienes permisos para ver estadísticas de este trabajador.');
    }

    return await this.getWorkSummary(workerId, { 
      id: workerId, 
      empresaId: worker.empresa?.id 
    } as UserPayload);
  }

  async getWeeklyTotal(usuarioId: number): Promise<number> {
    const ahora = new Date();
    const inicioSemana = new Date(ahora); 
    const dia = inicioSemana.getDay();
    const diff = inicioSemana.getDate() - dia + (dia === 0 ? -6 : 1);
    inicioSemana.setDate(diff);
    inicioSemana.setHours(0, 0, 0, 0);

    const res = await this.workdayRepository
      .createQueryBuilder("j")
      .select("SUM(j.total_segundos)", "suma")
      .where("j.usuario_id = :id AND j.inicio >= :inicio", { id: usuarioId, inicio: inicioSemana })
      .getRawOne();
    return parseInt(res.suma || 0);
  }


/**
   * Obtiene el total de horas trabajadas agrupadas por día para un mes específico.
   * Ideal para pintar calendarios en el Frontend.
   */
 async getMonthlyCalendar(usuarioId: number, year: number, month: number) {
  // 1. Buscamos al usuario y su empresa para saber la región
  const usuario = await this.userRepository.findOne({
    where: { id: usuarioId },
    relations: ['empresa']
  });

  const region = usuario?.empresa?.codigoRegion || 'MD'; // 'MD', 'CT', 'VC', etc.
  const hd = new Holidays('ES', region);

  const inicioMes = dayjs().tz(this.TIMEZONE).year(year).month(month - 1).startOf('month').toDate();
  const finMes = dayjs().tz(this.TIMEZONE).year(year).month(month - 1).endOf('month').toDate();

  // 2. Consulta de jornadas (lo que ya tenías)
  const registros = await this.workdayRepository
    .createQueryBuilder('w')
    .select('DATE(w.inicio)', 'fecha')
    .addSelect('SUM(w.total_segundos)', 'total_segundos')
    .where('w.usuario_id = :userId', { userId: usuarioId })
    .andWhere('w.inicio BETWEEN :inicio AND :fin', { inicio: inicioMes, fin: finMes })
    .groupBy('DATE(w.inicio)')
    .getRawMany();

  // 3. Obtener festivos del mes usando la librería
  const festivosMes = hd.getHolidays(year).filter(h => 
    dayjs(h.date).month() === (month - 1) && h.type === 'public'
  );

  const calendario: Record<string, any> = {};

  // --- PASO A: Llenar el calendario con los festivos primero ---
  festivosMes.forEach(f => {
    const fechaStr = dayjs(f.date).format('YYYY-MM-DD');
    calendario[fechaStr] = {
      esFestivo: true,
      nombreFestivo: f.name,
      segundos: 0,
      formateado: "00:00:00"
    };
  });

  // --- PASO B: Llenar/Sobrescribir con los registros de trabajo ---
  registros.forEach(r => {
    const fechaStr = dayjs(r.fecha).format('YYYY-MM-DD');
    const segundos = parseInt(r.total_segundos || '0', 10);

    // Si ya existía porque era festivo, mantenemos los datos del festivo pero añadimos las horas
    const infoPrevia = calendario[fechaStr] || {};

    calendario[fechaStr] = {
      ...infoPrevia,
      segundos: segundos,
      formateado: this.convertirSegundosAHora(segundos),
      esFestivo: infoPrevia.esFestivo || false
    };
  });

  return calendario;
}


  /**
   * Versión para admin del calendario mensual.
   * Valida que el trabajador pertenezca a la misma empresa que el admin.
   */
  async getWorkerMonthlyCalendarForAdmin(
    workerId: number, 
    adminEmpresaId: number, 
    year: number, 
    month: number
  ) {
    // 1. Verificamos que el trabajador existe y traemos su empresa
    const worker = await this.userRepository.findOne({
      where: { id: workerId },
      relations: ['empresa']
    });

    if (!worker) throw new NotFoundException('Trabajador no encontrado.');
    
    // 2. Seguridad: ¿El trabajador es de la empresa del admin?
    if (worker.empresa?.id !== adminEmpresaId) {
      throw new BadRequestException('No tienes permisos para ver el calendario de este trabajador.');
    }

    // 3. Si todo es correcto, reutilizamos la lógica de calendario que ya tenemos
    return await this.getMonthlyCalendar(workerId, year, month);
  }

  async getMonthlyTotal(usuarioId: number): Promise<number> {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const res = await this.workdayRepository
      .createQueryBuilder("j")
      .select("SUM(j.total_segundos)", "suma")
      .where("j.usuario_id = :id AND j.inicio >= :inicio", { id: usuarioId, inicio: inicioMes })
      .getRawOne();
    return parseInt(res.suma || 0);
  }

  // ============================================
  // MÉTODOS AUXILIARES 
  // ============================================
private async getTotalRangeDB(usuarioId: number, inicio: Date, fin: Date): Promise<number> {
    // Buscamos jornadas cerradas que "toquen" o se solapen con este periodo
    // Es decir: que empezaran antes de que acabe el periodo, y terminaran después de que empezara.
    const jornadas = await this.workdayRepository
      .createQueryBuilder("j")
      .where("j.usuario_id = :id", { id: usuarioId })
      .andWhere("j.fin IS NOT NULL")
      .andWhere("j.inicio <= :fin", { fin })
      .andWhere("j.fin >= :inicio", { inicio })
      .getMany();

    let totalSegundos = 0;

    for (const j of jornadas) {
      // Recortamos el inicio y el fin para que encajen estrictamente en el periodo solicitado
      const inicioReal = j.inicio.getTime() < inicio.getTime() ? inicio : j.inicio;
      const finReal = j.fin.getTime() > fin.getTime() ? fin : j.fin;

      const segundosEnPeriodo = Math.floor((finReal.getTime() - inicioReal.getTime()) / 1000);
      
      if (segundosEnPeriodo > 0) {
        totalSegundos += segundosEnPeriodo;
      }
    }

    return totalSegundos;
  }
  private formatPeriod(trabajado: number, teorico: number) {
    const balance = trabajado - teorico;
    return {
      trabajado: { segundos: trabajado, formateado: this.convertirSegundosAHora(trabajado) },
      teorico: { segundos: teorico, formateado: this.convertirSegundosAHora(teorico) },
      balance: { 
        segundos: balance, 
        formateado: this.convertirSegundosAHora(Math.abs(balance)),
        isNegative: balance < 0,
        completado: teorico > 0 ? parseFloat(((trabajado / teorico) * 100).toFixed(2)) : 0
      }
    };
  }

  private calcularSegundosFranja(inicio: string, fin: string): number {
    const [h1, m1] = inicio.split(':').map(Number);
    const [h2, m2] = fin.split(':').map(Number);
    return ((h2 * 60 + m2) - (h1 * 60 + m1)) * 60;
  }

  private convertirSegundosAHora(segundos: number): string {
    return Duration.fromObject({ seconds: segundos }).toFormat('hh:mm:ss');
  }

  private comprobarRetraso(horaActual: Date, horaTeoricaStr: string, margenMins: number): boolean {
    const [h, m] = horaTeoricaStr.split(':').map(Number);
    const minutosTeoricos = (h * 60) + m + margenMins;
    const minutosActuales = (horaActual.getHours() * 60) + horaActual.getMinutes();
    return minutosActuales > minutosTeoricos;
  }

  private comprobarSalidaAnticipada(horaActual: Date, horaTeoricaFinStr: string, margenMins: number): boolean {
    const [h, m] = horaTeoricaFinStr.split(':').map(Number);
    const minutosTeoricos = (h * 60) + m - margenMins;
    const minutosActuales = (horaActual.getHours() * 60) + horaActual.getMinutes();
    return minutosActuales < minutosTeoricos;
  }

  private calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private getSpainDate(): Date {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: this.TIMEZONE,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false,
    };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(new Date());
    const d: any = {};
    parts.forEach(p => d[p.type] = p.value);
    return new Date(d.year, d.month - 1, d.day, d.hour, d.minute, d.second);
  }
}