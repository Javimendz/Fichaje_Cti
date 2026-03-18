import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity  } from './entities/activity.entity';
import { CreateActividadDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';


/**
 *  Servicio para la gestión de actividades (puestos de trabajo)
 * 
 * Este servicio proporciona las funcionalidades necesarias para la gestión de actividades,
 * como la creación, actualización, desactivación y consulta de puestos de trabajo. 
 * 
 */
@Injectable()
export class ActividadService {
  constructor(
    @InjectRepository(Activity)
    private readonly actividadRepository: Repository<Activity>,
  ) {}

  // 1. CREAR UN PUESTO (Solo Admin)
  /**
   *  Crea un nuevo puesto de trabajo para la empresa especificada.
   * 
   * @param empresaId ID de la empresa a la que se asignará el puesto
   * @param dto Datos del puesto de trabajo a crear
   * @returns El puesto de trabajo creado
   */
  async create(empresaId: number, dto: CreateActividadDto) {
    const nuevaActividad = this.actividadRepository.create({
      empresaId,
      ...dto,
      activa: dto.activa !== undefined ? dto.activa : true, // Por defecto activa
    });
    return await this.actividadRepository.save(nuevaActividad);
  }

  // 2. LISTAR TODOS LOS PUESTOS DE LA EMPRESA
  /**
   *  Lista todos los puestos de trabajo de la empresa, opcionalmente solo los activos.
   * 
   * @param empresaId ID de la empresa para la cual se desean listar los puestos
   * @param soloActivas Si se desea listar solo los puestos activos (por defecto: false)
   * @returns Un array con todos los puestos de trabajo de la empresa (opcionalmente solo activos)
   */
  async findAllByEmpresa(empresaId: number, soloActivas: boolean = false) {
    const whereClause: any = { empresaId };
    
    if (soloActivas) {
      whereClause.activa = true;
    }

    return await this.actividadRepository.find({
      where: whereClause,
      order: { tipo: 'ASC', nombre: 'ASC' }, // Ordenamos por departamento/tipo y luego por nombre
    });
  }

  // 3. OBTENER UN PUESTO ESPECÍFICO
  /**
   *  Obtiene un puesto de trabajo específico por su ID y la empresa a la que pertenece.
   * 
   * @param id ID del puesto de trabajo a buscar
   * @param empresaId ID de la empresa en la que se desea buscar el puesto
   * @returns El puesto de trabajo encontrado
   */
  async findOne(id: number, empresaId: number) {
    const actividad = await this.actividadRepository.findOne({ 
      where: { id, empresaId },
      relations: ['workers'] 
    });
    
    if (!actividad) {
      throw new NotFoundException('El puesto de trabajo no existe en tu empresa');
    }
    return actividad;
  }

  // 4. ACTUALIZAR UN PUESTO
  /**
   *  Actualiza los datos de un puesto de trabajo existente.
   * 
   * @param id ID del puesto de trabajo a actualizar
   * @param empresaId ID de la empresa en la que se desea actualizar el puesto
   * @param dto Datos actualizados del puesto de trabajo
   * @returns El puesto de trabajo actualizado
   */
  async update(id: number, empresaId: number, dto: UpdateActivityDto) {
    const actividad = await this.findOne(id, empresaId); // Reutilizamos findOne por seguridad
    
    Object.assign(actividad, dto);
    return await this.actividadRepository.save(actividad);
  }

  // 5. DESACTIVAR (Soft Delete) - 
  /**
   *  Desactiva un puesto de trabajo existente, marcándolo como inactivo.
   * 
   * @param id ID del puesto de trabajo a desactivar
   * @param empresaId ID de la empresa en la que se desea desactivar el puesto
   * @returns Un mensaje indicando que el puesto ha sido desactivado
   */
  async remove(id: number, empresaId: number) {
    
    if(!empresaId)
      throw new NotFoundException(`La empresa con ID ${empresaId} no existe`);

   const actividad = await this.actividadRepository.findOne({
      where: { id, empresaId: empresaId}
    });

    if(!actividad)
      throw new NotFoundException(`La actividad con ID ${id} no existe o no tiene acceso`);

    await this.actividadRepository.delete(id)
    return { mensaje: `La actividad con ID ${id} ha sido eliminada correctamente.` };
  }
}