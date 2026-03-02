import {
  BadRequestException,
  
  NotFoundException,
} from '@nestjs/common';
import { MoreThan, Repository } from 'typeorm';
import { Issue } from './entities/issue.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateIncidenciaDto } from './dto/create-issue.dto';
import { UpdateIncidenciaDto } from './dto/update-issue.dto';


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
export class IssueService {
  constructor(
    @InjectRepository(Issue)
    private readonly incidenciaRepository: Repository<Issue>,
  ) {}

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
      resuelta: false,
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
  async findAllByEmpresa(
    empresaId: number,
    soloPendientes = false,
  ) {
    const where: any = { empresaId };

    if (soloPendientes) {
      where.resuelta = false;
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
   * Actualiza la incidencia con el ID especificado para la empresa dada.
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
    updateDto: UpdateIncidenciaDto,
  ) {
    const incidencia = await this.findOne(id, empresaId);

    Object.assign(incidencia, updateDto);

    return this.incidenciaRepository.save(incidencia);
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
    return this.incidenciaRepository.remove(incidencia);
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
  async resolver(id: number, empresaId: number) {
    const incidencia = await this.findOne(id, empresaId);

    if (incidencia.resuelta) {
      throw new BadRequestException('La incidencia ya está resuelta');
    }

    incidencia.resuelta = true;

    return this.incidenciaRepository.save(incidencia);
  }
}
