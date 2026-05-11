import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { Site } from './entities/site.entity';
import { Worker as WorkerEntity } from '../worker/entities/worker.entity'; // 🚩 Usa un alias si hay conflicto
import { CreateSiteDto } from './dto/create-site.dto';
import { CheckInSiteDto } from './dto/checkInSite.dto';
import { CheckOutSiteDto } from './dto/checkOutSite.dto';
import { CreateSiteIssueDto } from './dto/createSiteIssue.dto';
import { UserPayload } from '../auth/interfaces/user-payload.interface';
import { IssueSite } from '../issue-site/entities/issue-site.entity';
import { SiteLog } from '../siteLog/entities/siteLog.entity';
import { UpdateSiteDto } from './dto/update-site.dto';
import { AssignWorkerDto } from './dto/assign-worker.dto';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import minMax from 'dayjs/plugin/minMax';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(minMax);
dayjs.extend(isSameOrBefore);

const Holidays = require('date-holidays');

@Injectable()
export class SiteService {
 
  private readonly TIMEZONE = 'Europe/Madrid';

  constructor(
    @InjectRepository(Site) private readonly siteRepo: Repository<Site>,
    @InjectRepository(SiteLog) private readonly logRepo: Repository<SiteLog>,
    @InjectRepository(IssueSite) private readonly issueRepo: Repository<IssueSite>,
@InjectRepository(WorkerEntity) private readonly workerRepo: Repository<WorkerEntity>,  ) {}

  // ========================
  // GESTIÓN DE OBRAS (SITES)
  // ========================
 // src/site/site.service.ts

async create(createSiteDto: CreateSiteDto, admin: UserPayload) {
  // 1. Validamos que el admin tenga empresa
  if (!admin.empresaId) {
    throw new UnauthorizedException('No tienes empresa asignada para crear obras.');
  }

  // 🚩 NUEVA VALIDACIÓN: Verificar si ya existe
  // Buscamos una obra que coincida con el nombre O la dirección dentro de la MISMA empresa
  const existingSite = await this.siteRepo.findOne({
    where: [
      { name: createSiteDto.name,poblacion: createSiteDto.poblacion, empresaId: admin.empresaId },
      { direccion: createSiteDto.direccion, empresaId: admin.empresaId }
    ]
  });

  if (existingSite) {
    // Si el nombre coincide
    if (existingSite.name === createSiteDto.name) {
      throw new BadRequestException(`Ya existe una obra registrada con el nombre "${createSiteDto.name}".`);
    }
    // Si la dirección coincide
    if (existingSite.direccion === createSiteDto.direccion) {
      throw new BadRequestException(`Ya existe una obra registrada en la dirección "${createSiteDto.direccion}".`);
    }
  }

  // 2. Creamos la obra si no hay duplicados
  const newSite = this.siteRepo.create({
    ...createSiteDto, 
    empresaId: admin.empresaId,
    isActive: true
  });

  // 3. Guardamos en BD
  return await this.siteRepo.save(newSite);
}

  async getMonthlyCalendar(usuarioId: number, year: number, month: number) {
    const region = 'MD'; // O extraer de la empresa del trabajador si lo necesitas
    const hd = new Holidays('ES', region);

    // 1. Definir límites del mes
    const inicioMes = dayjs().tz(this.TIMEZONE).year(year).month(month - 1).startOf('month');
    const finMes = dayjs().tz(this.TIMEZONE).year(year).month(month - 1).endOf('month');

    // 2. Obtener los SiteLogs (Fichajes de Obra) cerrados que se solapan con este mes
    const logs = await this.logRepo.createQueryBuilder('log')
      .where('log.userId = :userId', { userId: usuarioId }) // O 'log.user_id' según cómo tengas mapeada la columna
      .andWhere('log.checkOut IS NOT NULL')
      .andWhere('log.checkIn <= :fin', { fin: finMes.toDate() })
      .andWhere('log.checkOut >= :inicio', { inicio: inicioMes.toDate() })
      .getMany();

    // 3. Inicializar el calendario
    const calendario: Record<string, any> = {};
    const numDias = inicioMes.daysInMonth();

    for (let i = 1; i <= numDias; i++) {
      const fechaActual = inicioMes.date(i);
      const fechaStr = fechaActual.format('YYYY-MM-DD');
      
      const festivo = hd.isHoliday(fechaActual.toDate());
      const esFestivoPublico = festivo && festivo.some((h: any) => h.type === 'public');

      calendario[fechaStr] = {
        segundos: 0,
        formateado: "00:00:00",
        esFestivo: !!esFestivoPublico,
        nombreFestivo: esFestivoPublico ? festivo.find((h: any) => h.type === 'public').name : null,
      };
    }

    // 4. Repartir segundos de los logs de obra por cada día
    for (const log of logs) {
      const inicioLog = dayjs(log.checkIn).tz(this.TIMEZONE);
      const finLog = dayjs(log.checkOut).tz(this.TIMEZONE);
      
      let cursor = dayjs.max([inicioLog, inicioMes]);
      const tope = dayjs.min([finLog, finMes]);

      while (cursor.isBefore(tope)) {
        const fechaStr = cursor.format('YYYY-MM-DD');
        if (calendario[fechaStr]) {
          const finDeEsteDia = cursor.endOf('day');
          const finFranjaActual = dayjs.min([finDeEsteDia, tope]);
          const segundosEnEsteDia = finFranjaActual.diff(cursor, 'second');
          
          if (segundosEnEsteDia > 0) {
            calendario[fechaStr].segundos += segundosEnEsteDia;
          }
          cursor = finDeEsteDia.add(1, 'millisecond');
        } else {
          break;
        }
      }
    }


    
    // 5. Formatear los totales diarios
    Object.keys(calendario).forEach(fecha => {
      calendario[fecha].formateado = this.convertirSegundosAHora(calendario[fecha].segundos);
    });

    return calendario;
  }

async getWorkerMonthlyCalendarForAdmin(
    workerId: number, 
    adminEmpresaId: number, 
    year: number, 
    month: number
  ) {
    // 1. Verificación de seguridad
    const worker = await this.workerRepo.findOne({
      where: { id: workerId } // Quitar relations si worker no tiene mapeado 'empresa' directamente, o adaptarlo a tu DB
    });

    if (!worker) throw new NotFoundException('Trabajador no encontrado.');
    if (worker.empresaId !== adminEmpresaId) {
      throw new BadRequestException('No tienes permisos para ver el calendario de este trabajador.');
    }

    // 2. Obtenemos el calendario de la obra
    const detalleDias = await this.getMonthlyCalendar(workerId, year, month);

    // 3. Calcular totales
    const dias = Object.values(detalleDias);
    const totalSegundosMes = dias.reduce((acc: number, dia: any) => acc + (dia.segundos || 0), 0);
    const totalDiasTrabajados = dias.filter((dia: any) => dia.segundos > 0).length;

    return {
      worker: {
        id: worker.id,
        nombre: worker.nombre,
        apellidos: worker.apellidos,
      },
      resumen: {
        totalSegundos: totalSegundosMes,
        totalFormateado: this.convertirSegundosAHora(totalSegundosMes),
        diasTrabajados: totalDiasTrabajados,
        mes: month,
        year: year
      },
      calendario: detalleDias 
    };
  }

  // Helper para formatear (alternativa pura si no quieres usar Luxon en SiteService)
  private convertirSegundosAHora(segundos: number): string {
    const hours = Math.floor(segundos / 3600);
    const minutes = Math.floor((segundos % 3600) / 60);
    const secs = Math.floor(segundos % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // src/site/site.service.ts

async getActiveSiteForWorker(userId: number) {
  // 1. Buscamos el log activo (donde checkOut sea NULL)
  const activeLog = await this.logRepo.findOne({
    where: { 
      user: { id: userId }, 
      checkOut: IsNull() 
    },
    relations: ['site'], // Traemos los datos de la obra asociada
  });

  // 2. Si no hay log activo, devolvemos un mensaje claro (o null)
  if (!activeLog) {
    return {
      active: false,
      message: 'El trabajador no tiene ningún fichaje activo actualmente.',
      site: null
    };
  }

  // 3. Devolvemos la obra y los datos del fichaje actual
  return {
    active: true,
    logId: activeLog.id,
    checkInTime: activeLog.checkIn,
    site: activeLog.site // Aquí va toda la info: nombre, dirección, lat, lng, etc.
  };
}


 async assignWorker(dto: AssignWorkerDto, admin: UserPayload) {
  // 1. Buscamos al trabajador con sus obras actuales
  const worker = await this.workerRepo.findOne({
    where: { id: dto.workerId, empresaId: admin.empresaId },
    relations: ['sites'] // Importante cargar las relaciones actuales
  });
  if (!worker) throw new NotFoundException('Trabajador no encontrado en tu empresa.');

  // 2. Buscamos todas las obras solicitadas que pertenezcan a la empresa
  const sites = await this.siteRepo.find({
    where: { 
      id: In(dto.siteIds), 
      empresaId: admin.empresaId,
      isActive: true 
    }
  });

  // 3. Validamos si todas las IDs enviadas son válidas
  if (sites.length !== dto.siteIds.length) {
    throw new BadRequestException('Una o más obras no existen o no pertenecen a tu empresa.');
  }

  // 4. Asignamos la nueva lista de obras
  worker.sites = sites;

  // 5. Guardamos (Save detecta el cambio en la tabla intermedia ManyToMany)
  await this.workerRepo.save(worker);

  return {
    message: `Trabajador ${worker.nombre} asignado con éxito a ${sites.length} obras.`,
    assignedSites: sites.map(s => s.name)
  };
}

  async update(id: number, updateSiteDto: UpdateSiteDto, admin: UserPayload) {
  // 1. Buscamos la obra asegurándonos de que sea de la empresa del admin
  const site = await this.siteRepo.findOne({
    where: { id, empresaId: admin.empresaId }
  });

  if (!site) {
    throw new NotFoundException('Obra no encontrada o no tienes permisos.');
  }

  // 2. Actualizamos los campos
  // Object.assign copiará solo los campos que vengan en el JSON de Postman 
  // (si mandan 'direccion', la actualiza; si no la mandan, la deja igual).
  Object.assign(site, updateSiteDto);

  // 3. Guardamos los cambios
  return await this.siteRepo.save(site);
}


  async findAllSites(empresaId: number) {
    return await this.siteRepo.find({ where: { empresaId, isActive: true } });
  }

  // ========================
  // FICHAJES (SITE LOGS)
  // ========================
  async checkIn(dto: CheckInSiteDto, user: UserPayload) {
    const site = await this.siteRepo.findOne({ where: { id: dto.siteId, empresaId: user.empresaId } });
    if (!site) throw new NotFoundException('Obra no encontrada o no pertenece a tu empresa');

    // Validar Geofencing
    const distance = this.calculateDistance(dto.latitude, dto.longitude, Number(site.latitude), Number(site.longitude));
    const isInside = distance <= site.radiusMeters;

    if (!isInside) {
      throw new BadRequestException(`Estás fuera de rango (${Math.round(distance)}m). El límite son ${site.radiusMeters}m.`);
    }

    // Verificar si ya tiene un fichaje abierto en obra
    const active = await this.logRepo.findOne({ where: { user: { id: user.id }, checkOut: IsNull() } });
    if (active) throw new BadRequestException('Ya tienes un registro de obra activo.');

    const log = this.logRepo.create({
      site: { id: dto.siteId },
      user: { id: user.id },
      checkIn: new Date(),
      latitudeIn: dto.latitude,
      longitudeIn: dto.longitude,
      isInsideIn: isInside,
      
      
    });

    return await this.logRepo.save(log);
  }

 // src/site/site.service.ts

async checkOut(logId: number, dto: CheckOutSiteDto, userId: number) {
  // 1. Buscamos el log cargando la relación con la obra (site)
  const log = await this.logRepo.findOne({ 
    where: { id: logId, user: { id: userId }, checkOut: IsNull() },
    relations: ['site'] // 🚩 Crucial para tener las coordenadas de la obra
  });

  if (!log) throw new NotFoundException('No se encontró un registro activo para cerrar.');

  // 2. Validar Geofencing de Salida
  const distance = this.calculateDistance(
    dto.latitude, 
    dto.longitude, 
    Number(log.site.latitude), 
    Number(log.site.longitude)
  );

  const isInside = distance <= log.site.radiusMeters;

  // 🚩 Si quieres que sea obligatorio estar en la obra para cerrar:
  if (!isInside) {
    throw new BadRequestException(
      `No puedes cerrar el fichaje fuera de la obra. Estás a ${Math.round(distance)}m.`
    );
  }

  // 3. Si está dentro, cerramos el registro
  log.checkOut = new Date();
  log.latitudeOut = dto.latitude;
  log.longitudeOut = dto.longitude;
  log.isInsideOut = isInside;
  log.notes = dto.notes;

  // 4. Cálculo de tiempo neto (restando pausas si las hubiera en el futuro)
  const totalBrutoMs = log.checkOut.getTime() - log.checkIn.getTime();
  log.totalSeconds = Math.floor(totalBrutoMs / 1000);

  return await this.logRepo.save(log);
}
async findOne(id: number, user: UserPayload) {
    // Buscamos la obra asegurando que pertenece a la empresa del usuario
    const site = await this.siteRepo.findOne({ 
      where: { 
        id, 
        empresaId: user.empresaId 
      } 
    });

    if (!site) {
      throw new NotFoundException(`La obra con ID #${id} no existe o no tienes permiso.`);
    }

    return site;
  }

// --- MÉTODO PARA EL TRABAJADOR (El que falla en el build) ---
async getSitesForWorker(userId: number) {
  // 1. Buscamos al trabajador cargando su relación plural 'sites'
  const worker = await this.workerRepo.findOne({
    where: { id: userId },
    relations: ['sites'] 
  });

  if (!worker) throw new NotFoundException('Trabajador no encontrado');

  // 2. Si no tiene obras asignadas (array vacío)
  if (!worker.sites || worker.sites.length === 0) {
    return {
      hasAssignedSites: false,
      sites: []
    };
  }

  // 3. Devolvemos la lista completa de objetos Site
  return {
    hasAssignedSites: true,
    sites: worker.sites // 🚩 Esto ya es un array con toda la info de las obras
  };
}

// --- MÉTODO PARA EL ADMINISTRADOR (El que añadimos antes) ---
async getSitesForWorkerByAdmin(workerId: number, admin: UserPayload) {
  const worker = await this.workerRepo.findOne({
    where: { id: workerId, empresaId: admin.empresaId },
    relations: ['sites']
  });

  if (!worker) throw new NotFoundException('Trabajador no encontrado en tu empresa');

  return {
    worker: `${worker.nombre} ${worker.apellidos || ''}`,
    sites: worker.sites || []
  };
}
async remove(id: number, user: UserPayload) {
  // 1. Verificamos que la obra existe y pertenece a la empresa del administrador
  // Usamos el método findOne que ya tienes, que lanza NotFoundException si no existe
  const site = await this.findOne(id, user);

  // 2. Borrado físico (Normal Delete)
  // Nota: Esto fallará si hay logs o incidencias vinculadas y no hay cascada.
  await this.siteRepo.delete(id);

  return { 
    message: `La obra "${site.name}" ha sido eliminada permanentemente del sistema.`,
    id: id 
  };
}
  // ========================
  // INCIDENCIAS
  // ========================
  async reportIncident(dto: CreateSiteIssueDto, user: UserPayload) {
    const issue = this.issueRepo.create({
      ...dto,
      site: { id: dto.siteId },
      user: { id: user.id }
    });
    return await this.issueRepo.save(issue);
  }

  // Helper: Haversine
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Radio tierra en metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }
}