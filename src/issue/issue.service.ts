import {
  BadRequestException,

  Injectable,

  InternalServerErrorException,

  NotFoundException,
} from '@nestjs/common';
import { IsNull, LessThan, MoreThan, Not, Repository } from 'typeorm';
import { Issue } from './entities/issue.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateIncidenciaDto } from './dto/create-issue.dto';
import { UpdateIncidenciaDto } from './dto/update-issue.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BaseCleanupService } from 'common/base/baseCleanup.service';
import { RequestStatus } from 'request/dto/revisar-request.dto';
import { Company } from 'company/entities/company.entity';
import { ConfigService } from '@nestjs/config';
import { UserPayload } from 'auth/interfaces/user-payload.interface';


// Servicio para la gestión de incidencias
// Esta clase proporciona métodos para la gestión de incidencias,
// incluyendo la creación, actualización, resolución y consulta de incidencias.
/**
 *  Servicio para la gestión de incidencias
 * 
 * Este servicio proporciona métodos para la gestión de incidencias,
 * incluyendo la creación, actualización, resolución y consulta de incidencias.
 * 
 * @Injectable()    
 * 
 *  */
@Injectable()
export class IssueService extends BaseCleanupService<Issue> {
  constructor(
    @InjectRepository(Issue)
    private readonly incidenciaRepository: Repository<Issue>,
    @InjectRepository(Issue) private readonly issueRepo: Repository<Issue>,
    @InjectRepository(Company) private readonly companyRepo: Repository<Company>,
    private readonly configService: ConfigService,
  ) {super(issueRepo, 'INCIDENCIAS'); }

  // ===============================
  // CREAR INCIDENCIA
  // ===============================

  /**
   * Crea una nueva incidencia para el usuario y empresa especificados.
   * 
   * @param userId ID del usuario que crea la incidencia
   * @param empresaId ID de la empresa a la que pertenece la incidencia
   * @param dto Datos de la incidencia a crear
   * @returns La incidencia creada
   * @throws {BadRequestException} Si el usuario ha creado una incidencia recientemente o si ya existe una incidencia del mismo tipo hoy
   */
  async create(
    userId: number,
    empresaId: number,
    dto: CreateIncidenciaDto,
  ) {
    const haceQuinceMinutos = new Date(Date.now() - 15 * 60 * 1000);

    // Evitar spam cada 15 min
    const ultimaIncidencia = await this.incidenciaRepository.findOne({
      where: {
        userId,
        empresaId,
        createdAt: MoreThan(haceQuinceMinutos),
      },
      order: { createdAt: 'DESC' },
    });

    if (ultimaIncidencia) {
      throw new BadRequestException(
        'Espera 15 minutos antes de crear otra incidencia.',
      );
    }

    // Evitar duplicado mismo tipo en el mismo día
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);

    const incidenciaHoy = await this.incidenciaRepository.findOne({
      where: {
        userId,
        empresaId,
        tipo: dto.tipo,
        createdAt: MoreThan(inicioHoy),
      },
    });

    if (incidenciaHoy) {
      throw new BadRequestException(
        'Ya existe una incidencia de este tipo hoy.',
      );
    }

    const incidencia = this.incidenciaRepository.create({
      userId,
      empresaId,
      ...dto,
      nombre: dto.nombre,
      apellidos: dto.apellidos,
      estado: dto.estado ?? true,
    });

    return this.incidenciaRepository.save(incidencia);
  }

  // ===============================
  // CONSULTAS
  // ===============================
  /**
   *  Devuelve todas las incidencias ordenadas por fecha de creación descendente.
   * 
   * @returns Todas las incidencias
   */

  findAll() {
    return this.incidenciaRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Devuelve todas las incidencias del usuario especificado ordenadas por fecha de creación descendente.
   * 
   * @param userId ID del usuario
   * @returns Todas las incidencias del usuario
   */
  findAllByUsuario(userId: number) {
    return this.incidenciaRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Devuelve la incidencia con el ID especificado para la empresa dada.
   * 
   * @param id ID de la incidencia
   * @param empresaId ID de la empresa
   * @returns La incidencia encontrada
   * @throws {NotFoundException} Si la incidencia no se encuentra
   */
  async findOne(id: number, empresaId: number) {
    const incidencia = await this.incidenciaRepository.findOne({
      where: { id, empresaId },
    });

    if (!incidencia) {
      throw new NotFoundException('Incidencia no encontrada');
    }

    return incidencia;
  }

  /**
   * Devuelve todas las incidencias de la empresa especificada,
   * opcionalmente filtrando por incidencias pendientes.
   * 
   * @param empresaId ID de la empresa
   * @param soloPendientes Si se desea filtrar solo por incidencias pendientes (opcional, por defecto false)
   * @returns Todas las incidencias de la empresa
   */
async findAllByEmpresa(empresaId: number, soloPendientes = false) {
  const where: any = { empresaId };

  if (soloPendientes) {
    where.estado = false; // Solo pendientes
  } else {
    where.estado = true;  // Solo resueltas (Tramitadas)
  }

  return this.incidenciaRepository.find({
    where,
    relations: ['usuario'],
    order: { createdAt: 'DESC' },
  });
}

  // ===============================
  // UPDATE / DELETE
  // ===============================

  /**
   * 
   * Actualiza/edita la incidencia con el ID especificado para la empresa dada.
   * 
   * @param id ID de la incidencia
   * @param empresaId ID de la empresa
   * @param updateDto Datos de actualización de la incidencia
   * @returns La incidencia actualizada
   * @throws {NotFoundException} Si la incidencia no se encuentra
   */
  async update(
    id: number,
    empresaId: number,
    updateDto: Partial<CreateIncidenciaDto>, // Usamos Partial para que todo sea opcional al editar
  ) {
    const incidencia = await this.findOne(id, empresaId);

    // 1. Regla de negocio: Si ya está resuelta (false), no se edita
    // Nota: Revisa si en tu lógica 'false' es resuelta o 'true' es resuelta. 
    // Según tu código anterior: incidencia.estado === true significa resuelta.
    if (incidencia.estado === true) {
      throw new BadRequestException('No puedes editar una incidencia ya resuelta');
    }

    // 2. Actualización selectiva (Evitamos que los valores por defecto del DTO ganen)
    if (updateDto.tipo) incidencia.tipo = updateDto.tipo;
    if (updateDto.descripcion) incidencia.descripcion = updateDto.descripcion;
    if (updateDto.nombre) incidencia.nombre = updateDto.nombre;
    if (updateDto.apellidos) incidencia.apellidos = updateDto.apellidos;

    // 3. El estado SOLO se actualiza si viene explícitamente en el Body
    if (updateDto.estado !== undefined) {
      incidencia.estado = updateDto.estado;
    }

    return await this.incidenciaRepository.save(incidencia);
  }
  /**
   * 
   * Elimina la incidencia con el ID especificado para la empresa dada.
   * 
   * @param id ID de la incidencia
   * @param empresaId ID de la empresa
   * @returns La incidencia eliminada
   * @throws {NotFoundException} Si la incidencia no se encuentra
   */
  async remove(id: number, empresaId: number) {
    const incidencia = await this.findOne(id, empresaId);
    // softRemove llena la columna deletedAt en lugar de hacer un DELETE SQL
    return this.incidenciaRepository.softRemove(incidencia);
  }
  /**
   * 
   * Marca la incidencia con el ID especificado como resuelta para la empresa dada.
   * 
   * @param id ID de la incidencia
   * @param empresaId ID de la empresa
   * @returns La incidencia marcada como resuelta
   * @throws {NotFoundException} Si la incidencia no se encuentra o ya está resuelta  
   * @throws {BadRequestException} Si la incidencia ya está resuelta
   * 
   */
  async resolver(id: number, empresaId: number, dto: UpdateIncidenciaDto) {
    const incidencia = await this.findOne(id, empresaId);

    if (incidencia.estado) {
      throw new BadRequestException('La incidencia ya está resuelta');
    }

    incidencia.estado = true;
    // Solo actualiza campos si realmente vienen en el DTO
    if (dto.descripcion) incidencia.descripcion = dto.descripcion;

    return this.incidenciaRepository.save(incidencia);
  }

  /*
  @Cron(CronExpression.EVERY_MINUTE)
  async handleAutoSoftDelete() {
    const haceCincoDias = new Date();
    haceCincoDias.setDate(haceCincoDias.getDate() - 5);
    console.log('--- [CRON INCIDENCIAS] Buscando registros para ocultar... ---');
    //const unMinutoAtras = new Date();
    //unMinutoAtras.setMinutes(unMinutoAtras.getMinutes() - 1); // 👈 Restamos 1 minuto en lugar de 5 días
    // 1. Buscamos las incidencias que:
    // - Estén resueltas (estado === true)
    // - Su última actualización (updatedAt) fuera hace más de 5 días
    const incidenciasAOCultar = await this.incidenciaRepository.find({
      where: {
        estado: true,
        updatedAt: LessThan(haceCincoDias),
      },
    });

    if (incidenciasAOCultar.length > 0) {
      // 2. Aplicamos Soft Delete a todas
      await this.incidenciaRepository.softRemove(incidenciasAOCultar);
      console.log(`[Cron] Se han ocultado ${incidenciasAOCultar.length} incidencias antiguas.`);
    }
  }
    */


  @Cron(CronExpression.EVERY_MINUTE)
  async handleCleanup() {
    console.log('⏰ [CRON INCIDENCIAS] ¡Despertando!'); // 👈 Añade esto
    const empresas = await this.companyRepo.find();
    const defaultDays = +this.configService.get('DEFAULT_DAYS_ISSUES') || 5;

    for (const empresa of empresas) {
    // CAMBIA || POR ??
    const dias = empresa.daysArchiveIssues ?? defaultDays; 
    await this.cleanOldRecords(dias, true, empresa.id);
  }
  }


  async getOcultas(empresaId: number){

    return await this.incidenciaRepository.find({

      where: { empresaId: empresaId, deletedAt: Not(IsNull())},
      withDeleted: true,
      relations:['usuario'],
      order: {deletedAt: 'DESC'},
    })

  }

 
}
