import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, LessThan, Between } from 'typeorm';
import { SiteLog } from './entities/siteLog.entity';
import { Site } from '../site/entities/site.entity';

import { UserPayload } from '../auth/interfaces/user-payload.interface';
import { CheckOutSiteDto } from '../site/dto/checkOutSite.dto';
import { CheckInSiteDto } from '../site/dto/checkInSite.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SiteLogBreak } from './entities/siteLogBreak.entity';
import { UpdateSiteLogDto } from './dto/update-siteLog.dto';

@Injectable()
export class SiteLogService {
  private readonly logger = new Logger(SiteLogService.name);

  constructor(
    @InjectRepository(SiteLog) private readonly logRepo: Repository<SiteLog>,
    @InjectRepository(Site) private readonly siteRepo: Repository<Site>,
    @InjectRepository(SiteLogBreak) private readonly breakRepo: Repository<SiteLogBreak>,
  ) {}

  // ========================
  // ENTRADA A LA OBRA (CHECK-IN)
  // ========================
 async checkIn(dto: CheckInSiteDto, user: UserPayload) {
  const now = new Date();
  const clientTime = new Date(dto.clientTimestamp);

  // --- 🚩 VALIDACIÓN DE SEGURIDAD ---
  
  // 1. ¿Viene del futuro? (Permitimos 5 min de margen por desajustes de reloj)
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60000);
  if (clientTime > fiveMinutesFromNow) {
    throw new BadRequestException('La fecha de fichaje no puede ser futura.');
  }

  // 2. ¿Es demasiado antigua? (Ejemplo: no permitimos fichajes de hace más de 24h)
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60000);
  if (clientTime < twentyFourHoursAgo) {
    throw new BadRequestException('El fichaje es demasiado antiguo para ser procesado automáticamente.');
  }

  // --- Lógica normal de Geofencing ---
  const site = await this.siteRepo.findOne({ 
    where: { id: dto.siteId, empresaId: user.empresaId } 
  });

  // 2. Validación crítica
  // Este IF es el que "limpia" el tipo de Site | null a solo Site
  if (!site) {
    throw new NotFoundException('La obra no existe o no tienes acceso.');
  }
  // ... (tus validaciones de distancia)

  const log = this.logRepo.create({
    site: site,
    user: { id: user.id },
    checkIn: clientTime,       // ✅ Usamos la del cliente
    serverReceivedAt: now,     // 🔍 Guardamos cuándo llegó para control
    latitudeIn: dto.latitude,
    longitudeIn: dto.longitude,
    isInsideIn: true
  });

  return await this.logRepo.save(log);
}


  async startBreak(logId: number, user: UserPayload) {
  // 1. Validar que el fichaje está abierto
  const log = await this.logRepo.findOne({
    where: { id: logId, user: { id: user.id }, checkOut: IsNull() }
  });
  if (!log) throw new BadRequestException('No hay un fichaje activo para iniciar pausa.');

  // 2. Validar que no haya ya una pausa abierta
  const activeBreak = await this.breakRepo.findOne({
    where: { siteLog: { id: logId }, endTime: IsNull() }
  });
  if (activeBreak) throw new BadRequestException('Ya tienes una pausa en curso.');

  // 3. Crear la pausa
  const newBreak = this.breakRepo.create({
    siteLog: log,
    startTime: new Date()
  });

  return await this.breakRepo.save(newBreak);
}

// --- TERMINAR PAUSA ---
async endBreak(logId: number, user: UserPayload) {
  const activeBreak = await this.breakRepo.findOne({
    where: { siteLog: { id: logId }, endTime: IsNull() }
  });

  if (!activeBreak) throw new BadRequestException('No hay ninguna pausa activa para cerrar.');

  activeBreak.endTime = new Date();
  
  // Calcular duración de esta pausa
  const diffMs = activeBreak.endTime.getTime() - activeBreak.startTime.getTime();
  activeBreak.durationSeconds = Math.floor(diffMs / 1000);

  return await this.breakRepo.save(activeBreak);
}

  // ========================
  // SALIDA DE LA OBRA (CHECK-OUT)
  // ========================
 
// src/site-log/site-log.service.ts

async checkOut(logId: number, dto: CheckOutSiteDto, user: UserPayload) {
  // 1. Buscamos el log activo cargando las relaciones de 'site' (para geofencing) 
  // y 'breaks' (para descontar el tiempo de descanso)
  const log = await this.logRepo.findOne({
    where: { 
      id: logId, 
      user: { id: user.id }, 
      checkOut: IsNull() 
    },
    relations: ['site', 'breaks'] 
  });

  if (!log) {
    throw new NotFoundException('No se encontró el fichaje de obra activo o ya ha sido cerrado.');
  }

  // 🚩 VALIDACIÓN EXTRA: Comprobar si hay una pausa que no se ha cerrado
  const openBreak = log.breaks.find(b => !b.endTime);
  if (openBreak) {
    throw new BadRequestException('Debes cerrar tu pausa activa antes de realizar el Check-Out.');
  }

  // 2. Validar Geofencing de Salida
  const distance = this.calculateDistance(
    dto.latitude, 
    dto.longitude,
    Number(log.site.latitude), 
    Number(log.site.longitude)
  );

  const isInsideOut = distance <= log.site.radiusMeters;

  // Bloqueamos la salida si el trabajador no está físicamente en la obra
  if (!isInsideOut) {
    throw new BadRequestException(
      `No puedes fichar la salida fuera de la obra. Estás a ${Math.round(distance)}m del punto central.`
    );
  }

  // 3. Registro de datos y marcas de tiempo
  log.checkOut = new Date();
  log.latitudeOut = dto.latitude;
  log.longitudeOut = dto.longitude;
  log.isInsideOut = isInsideOut;
  log.notes = dto.notes;
  
  // 4. CÁLCULO DE TIEMPO EFECTIVO (Restando pausas)
  
  // A) Tiempo total transcurrido desde la entrada hasta ahora
  const totalElapsedMs = log.checkOut.getTime() - log.checkIn.getTime();
  const totalElapsedSeconds = Math.floor(totalElapsedMs / 1000);

  // B) Sumar la duración de todas las pausas registradas
  // Reducimos el array de breaks sumando los 'durationSeconds' de cada una
  const totalBreakSeconds = log.breaks.reduce((acc, b) => acc + (b.durationSeconds || 0), 0);

  // C) Tiempo efectivo = (Tiempo Total) - (Tiempo en Pausas)
  // Aseguramos que no sea negativo (por si acaso hubiera errores de reloj)
  log.totalSeconds = Math.max(0, totalElapsedSeconds - totalBreakSeconds);

  // 5. Guardado final
  const savedLog = await this.logRepo.save(log);

  this.logger.log(`[CHECK-OUT] Usuario ${user.id} salió de la obra ${log.site.name}. Tiempo efectivo: ${log.totalSeconds}s.`);

  return savedLog;
}

  @Cron(CronExpression.EVERY_HOUR)
  async handleAutoCheckOut() {
    this.logger.log('Iniciando proceso de Auto-Check-Out...');

    // 1. Definimos el límite (ejemplo: 12 horas atrás)
    const limitDate = new Date();
    limitDate.setHours(limitDate.getHours() - 12);

    // 2. Buscamos logs que no tengan checkOut y cuya entrada sea más vieja que el límite
    const openLogs = await this.logRepo.find({
      where: {
        checkOut: IsNull(),
        checkIn: LessThan(limitDate), // Fichajes de hace más de 12h
      },
      relations: ['user']
    });

    if (openLogs.length === 0) return;

    for (const log of openLogs) {
      // 3. Cerramos el fichaje automáticamente
      // Regla de negocio: Le ponemos, por ejemplo, 8 horas de trabajo desde su entrada
      const autoCloseDate = new Date(log.checkIn);
      autoCloseDate.setHours(autoCloseDate.getHours() + 8); 

      log.checkOut = autoCloseDate;
      log.wasAutoClosed = true; // 🚩 Marcamos para revisión
      log.notes = 'Cerrado automáticamente por el sistema tras 12h de inactividad.';
      
      const diffMs = log.checkOut.getTime() - log.checkIn.getTime();
      log.totalSeconds = Math.floor(diffMs / 1000);

      await this.logRepo.save(log);
      
      this.logger.warn(`Auto-Check-Out aplicado al usuario ID ${log.user.id} en el log ID ${log.id}`);
    }
  }

  async findMyLogs(userId: number, page: number = 1, limit: number = 10) {
  const [data, total] = await this.logRepo.findAndCount({
    where: { user: { id: userId } },
    relations: ['site'],
    order: { checkIn: 'DESC' },
    take: limit,
    skip: (page - 1) * limit,
  });

  return { data, total, page, lastPage: Math.ceil(total / limit) };
}

async findAllAdmin(empresaId: number, filters: { siteId?: number, start?: string, end?: string }) {
  const query = this.logRepo.createQueryBuilder('log')
    .leftJoinAndSelect('log.site', 'site')
    .leftJoinAndSelect('log.user', 'user')
    .where('site.empresaId = :empresaId', { empresaId });

  if (filters.siteId) {
    query.andWhere('site.id = :siteId', { siteId: filters.siteId });
  }

  if (filters.start && filters.end) {
    query.andWhere('log.checkIn BETWEEN :start AND :end', { 
      start: new Date(filters.start), 
      end: new Date(filters.end) 
    });
  }

  return await query.orderBy('log.checkIn', 'DESC').getMany();
}


  async updateManual(logId: number, dto: UpdateSiteLogDto, admin: UserPayload) {
  const log = await this.logRepo.findOne({
    where: { id: logId, site: { empresaId: admin.empresaId } }
  });

  if (!log) throw new NotFoundException('Fichaje no encontrado en su empresa.');

  // Si se cambia el horario, recalculamos los segundos automáticamente
  if (dto.checkIn || dto.checkOut) {
    const start = dto.checkIn ? new Date(dto.checkIn) : log.checkIn;
    const end = dto.checkOut ? new Date(dto.checkOut) : log.checkOut;
    
    if (end && start > end) throw new BadRequestException('La entrada no puede ser posterior a la salida.');
    
    log.checkIn = start;
    log.checkOut = end;
    
    if (end) {
      const diff = end.getTime() - start.getTime();
      log.totalSeconds = Math.floor(diff / 1000);
    }
  }

  log.isManual = true;
  log.editedByAdminId = admin.id;
  log.notes = dto.notes || log.notes;

  return await this.logRepo.save(log);
}




  async remove(id: number, admin: UserPayload) {
  const log = await this.logRepo.findOne({
    where: { id, site: { empresaId: admin.empresaId } }
  });

  if (!log) throw new NotFoundException('No se puede eliminar un fichaje que no existe o no pertenece a su empresa.');

  await this.logRepo.remove(log);
  return { message: 'Fichaje eliminado correctamente.' };
}


  async getWorkerReport(userId: number, startDate: string, endDate: string, empresaId: number) {
  // 1. Buscamos todos los fichajes del usuario en ese rango de fechas
  // Usamos el campo 'checkIn' para determinar en qué día cae el registro
  const logs = await this.logRepo.find({
    where: {
      user: { id: userId, empresaId: empresaId }, // Seguridad: validamos empresa
      checkIn: Between(new Date(startDate), new Date(endDate)),
      checkOut: IsNull() // Solo sumamos lo que ya terminó
    },
    relations: ['site'],
    order: { checkIn: 'ASC' }
  });

  // 2. Sumamos el total de segundos
  const totalSeconds = logs.reduce((acc, log) => acc + (log.totalSeconds || 0), 0);

  // 3. Calculamos horas, minutos y segundos para el reporte
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    workerId: userId,
    period: { from: startDate, to: endDate },
    summary: {
      totalSeconds,
      formattedTime: `${hours}h ${minutes}m ${seconds}s`,
      totalHoursDecimal: Number((totalSeconds / 3600).toFixed(2)), // Útil para multiplicar por el precio/hora
      daysWorked: logs.length
    },
    details: logs.map(log => ({
      date: log.checkIn.toISOString().split('T')[0],
      site: log.site.name,
      entry: log.checkIn,
      exit: log.checkOut,
      seconds: log.totalSeconds,
      autoClosed: log.wasAutoClosed // Para que RRHH vea si hubo cierres automáticos
    }))
  };
}

  // ========================
  // UTILIDAD: CÁLCULO DISTANCIA
  // ========================
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Radio de la Tierra en metros
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const deltaP = (lat2 - lat1) * Math.PI / 180;
    const deltaL = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaP / 2) * Math.sin(deltaP / 2) +
              Math.cos(p1) * Math.cos(p2) *
              Math.sin(deltaL / 2) * Math.sin(deltaL / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; 
  }
}