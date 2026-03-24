import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Between, Not } from 'typeorm';
import { Workday } from './entities/workday.entity';
import { CheckInDto } from './dto/check-in.dto';
import type { UserPayload } from 'auth/interfaces/user-payload.interface';
import { AlarmsService } from 'alarms/alarms.service';
import { AlarmType } from 'alarms/entities/alarm.entity';
import { User } from 'users/entities/user.entity';
import { ScheduleService } from 'schedule/schedule.service'; // 👈 IMPORTANTE AÑADIR ESTO

@Injectable()
export class WorkdayService {
  private readonly logger = new Logger('WorkdayService');

  constructor(
    @InjectRepository(Workday) private readonly workdayRepository: Repository<Workday>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly alarmService: AlarmsService,
    private readonly scheduleService: ScheduleService, // 👈 INYECTADO AQUÍ
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
      relations: ['empresa'] // Ya no necesitamos traer todo el horario aquí
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

    // 🔥 FIX: VALIDACIÓN DE RETRASO USANDO LA ROTACIÓN REAL
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
    jornada.fin = ahora;
    if (dto.latitud && dto.longitud) {
      jornada.latitudSalida = dto.latitud;
      jornada.longitudSalida = dto.longitud;
    }

    // 💡 GUARDAMOS EN SEGUNDOS
    jornada.total_segundos = Math.floor((ahora.getTime() - jornada.inicio.getTime()) / 1000);
    jornada.tipo = 'Salida';
    jornada.presente = dto.presente;

    const saved = await this.workdayRepository.save(jornada);
    // ... lógica de alarmas de salida
    return saved;
  }


async getWorkSummary(usuarioId: number) {
    const ahora = new Date();
    const inicioHoy = new Date(ahora);
    inicioHoy.setHours(0, 0, 0, 0);

    // 💡 Ejecutamos las 4 consultas pesadas en paralelo
    const [mensualDB, semanalDB, hoyDB, activa] = await Promise.all([
      this.getMonthlyTotal(usuarioId),
      this.getWeeklyTotal(usuarioId),
      this.getDailyTotalDB(usuarioId, inicioHoy),
      this.findActiveWorkday(usuarioId)
    ]);

    // 💡 BUG SOLUCIONADO: Si hay jornada activa, calculamos cuánto lleva "hoy" hasta este milisegundo
    const segundosEnVivo = activa 
      ? Math.floor((ahora.getTime() - activa.inicio.getTime()) / 1000) 
      : 0;

    const totalHoy = hoyDB + segundosEnVivo;
    const totalSemana = semanalDB + segundosEnVivo;
    const totalMes = mensualDB + segundosEnVivo;

    return {
      hoy: { segundos: totalHoy, formateado: this.convertirSegundosAHora(totalHoy) },
      semana: { segundos: totalSemana, formateado: this.convertirSegundosAHora(totalSemana) },
      mes: { segundos: totalMes, formateado: this.convertirSegundosAHora(totalMes) },
      isWorking: !!activa
    };
  }

  private async getDailyTotalDB(usuarioId: number, inicio: Date): Promise<number> {
    const res = await this.workdayRepository
      .createQueryBuilder("j")
      .select("SUM(j.total_segundos)", "suma")
      .where("j.usuario_id = :id AND j.inicio >= :inicio", { id: usuarioId, inicio })
      .getRawOne();
    return parseInt(res.suma || 0);
  }

// 2. TOTAL SEMANAL (Segundos puros)
async getWeeklyTotal(usuarioId: number): Promise<number> {
    const ahora = new Date();
    const inicioSemana = new Date(ahora); // 💡 Copia para evitar mutación
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

  // 1. TOTAL MENSUAL (Segundos puros)
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

  // 3. SUMMARY (Objeto formateado para el Frontend)
 

  // Utilidad para convertir segundos a texto HH:MM:SS
private convertirSegundosAHora(segundos: number): string {
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    const s = segundos % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // ============================================
  // MÉTODOS DE HISTORIAL Y STATUS (Sin cambios)
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

  // ============================================
  // MÉTODOS AUXILIARES (Lógica de negocio)
  // ============================================

  // Nota: obtenerDistribucionHoy ha sido eliminado porque ahora usamos scheduleService.getTurnoHoy

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
}