import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from '../site/entities/site.entity';
import { UserPayload } from '../auth/interfaces/user-payload.interface';
import { IncidentSeverity } from '../site/enums/issue-type.enum';
import { IssueSite } from './entities/issue-site.entity';
import { CreateIssueSiteDto } from './dto/create-issue-site.dto';
import { ResolveIssueDto } from './dto/resolve-issue.dto';
import { AssignIssueDto } from '../issue/dto/asign-issue.dto';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class IssueSiteService {
  constructor(
    @InjectRepository(IssueSite) private readonly incidentRepo: Repository<IssueSite>,
    @InjectRepository(Site) private readonly siteRepo: Repository<Site>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  // ========================
  // CREAR INCIDENCIA
  // ========================
  async create(dto: CreateIssueSiteDto, user: UserPayload) {
    const site = await this.siteRepo.findOne({ 
      where: { id: dto.siteId, empresaId: user.empresaId } 
    });

    if (!site) {
      throw new NotFoundException('La obra no existe o no tienes acceso a ella.');
    }

    // 🚩 Ahora incluimos evidenceImages (Array de URLs)
    const incident = this.incidentRepo.create({
      ...dto,
      site: { id: dto.siteId },
      user: { id: user.id },
      // Aseguramos que sea un array
    });

    const savedIncident = await this.incidentRepo.save(incident);

    if (dto.severity === IncidentSeverity.HIGH) {
      this.notifyAdmin(savedIncident, site.name);
    }

    return savedIncident;
  }

  // ========================
  // LISTAR POR OBRA
  // ========================
  async findAllBySite(siteId: number, user: UserPayload) {
    return await this.incidentRepo.find({
      where: { 
        site: { id: siteId, empresaId: user.empresaId } 
      },
      relations: ['user', 'resolvedBy'], // 🚩 Cargamos también quién la resolvió
      order: { createdAt: 'DESC' }
    });
  }

  // ========================
  // RESOLVER INCIDENCIA (Actualizado)
  // ========================
  async resolve(id: number, dto: ResolveIssueDto, user: UserPayload) {
    // Buscamos la incidencia validando la empresa del usuario actual
    const incident = await this.incidentRepo.findOne({
      where: { id, site: { empresaId: user.empresaId } }
    });

    if (!incident) throw new NotFoundException('Incidencia no encontrada.');
    
    if (incident.isResolved) {
        throw new BadRequestException('Esta incidencia ya ha sido resuelta.');
    }

    // 🚩 Actualizamos con la información de resolución
    incident.isResolved = true;
    incident.resolvedAt = new Date();
    incident.resolutionNote = dto.resolutionNote; // El "Cómo"
    incident.resolvedBy = { id: user.id } as any; // El "Quién"

    return await this.incidentRepo.save(incident);
  }

  private notifyAdmin(incident: IssueSite, siteName: string) {
    // Lógica de notificación...
    console.log(`🚨 ALERTA CRÍTICA en ${siteName}: ${incident.description}`);
  }


  async assign(id: number, dto: AssignIssueDto, admin: UserPayload) {
  // 1. Buscar la incidencia validando la empresa del admin
  const incident = await this.incidentRepo.findOne({
    where: { id, site: { empresaId: admin.empresaId } },
    relations: ['site']
  });

  if (!incident) throw new NotFoundException('Incidencia no encontrada.');

  // 2. Validar que el usuario asignado existe y es de la misma empresa
  const workerToAssign = await this.userRepo.findOne({
    where: { id: dto.assignedToId, empresaId: admin.empresaId }
  });

  if (!workerToAssign) {
    throw new BadRequestException('El trabajador asignado no existe o no pertenece a tu empresa.');
  }

  // 3. Asignar
  incident.assignedTo = workerToAssign;
  incident.assignedAt = new Date();

  return await this.incidentRepo.save(incident);
}

async findAllAssignedToMe(userId: number) {
  return await this.incidentRepo.find({
    where: { 
      assignedTo: { id: userId }, 
      isResolved: false // Solo las que aún tiene que arreglar
    },
    relations: ['site'],
    order: { severity: 'DESC', createdAt: 'ASC' }
  });
}
}