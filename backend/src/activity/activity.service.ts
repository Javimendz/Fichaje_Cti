import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity  } from './entities/activity.entity';
import { CreateActividadDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { UserRole } from 'auth/roles.enum';
import { UserPayload } from 'auth/interfaces/user-payload.interface';


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
  async create(user: UserPayload, dto: CreateActividadDto) {
    // 🛡️ Seguridad en el servicio
    if (user.rol !== UserRole.ADMIN && user.rol !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Solo los administradores pueden crear puestos de trabajo');
    }

    const nuevaActividad = this.actividadRepository.create({
      empresaId: user.empresaId,
      ...dto,
      activa: dto.activa !== undefined ? dto.activa : true,
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
async findAllByEmpresa(user: UserPayload, soloActivas: boolean = false) {
    // 🛡️ Lógica de visibilidad:
    // Un Worker TAL VEZ necesita ver los puestos activos para seleccionarlo al fichar.
    // Pero si NO quieres que vea nada de la lista global, bloqueamos aquí:
    if (user.rol === UserRole.WORKER && !soloActivas) {
       throw new ForbiddenException('No tienes permiso para ver el listado global de puestos');
    }

    const whereClause: any = { empresaId: user.empresaId };
    
    // Si es Worker, forzamos que solo vea las que están 'activa: true'
    if (soloActivas || user.rol === UserRole.WORKER) {
      whereClause.activa = true;
    }

    return await this.actividadRepository.find({
      where: whereClause,
      order: { tipo: 'ASC', nombre: 'ASC' },
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
async findOne(id: number, user: UserPayload) {
  const actividad = await this.actividadRepository.findOne({ 
    where: { id, empresaId: user.empresaId },
    relations: ['workers'] 
  });
  
  if (!actividad) {
    throw new NotFoundException('El puesto de trabajo no existe o no pertenece a tu empresa');
  }

  // 🛡️ Si es un Worker, extraemos 'workers' y devolvemos el resto
  if (user.rol === UserRole.WORKER) {
      const { workers, ...actividadSegura } = actividad;
      return actividadSegura; // 'workers' se queda fuera del retorno
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
 async update(id: number, user: UserPayload, dto: UpdateActivityDto) {
  if (user.rol !== UserRole.ADMIN && user.rol !== UserRole.SUPERADMIN) {
    throw new ForbiddenException('No tienes permiso para modificar puestos de trabajo');
  }

  const actividad = await this.findOne(id, user); 
  
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

 async countWorkersInActivity(actividadId: number, user: UserPayload) {
  // 1. 🛡️ Validación rápida: ¿Existe la actividad y es de mi empresa?
  // Buscamos solo UNA, no todas.
  const actividad = await this.actividadRepository.findOne({
    where: { 
      id: actividadId, 
      empresaId: user.empresaId 
    }
  });

  if (!actividad) {
    throw new NotFoundException(`La actividad con ID ${actividadId} no existe o no tienes acceso a ella`);
  }

  // 2. 🔢 Conteo eficiente mediante QueryBuilder
  const total = await this.actividadRepository.createQueryBuilder('activity')
    .leftJoin('activity.workers', 'worker') // Unimos con la relación de trabajadores
    .where('activity.id = :id', { id: actividadId })
    .getCount();

  return {
    actividadId: actividad.id,
    nombre: actividad.nombre,
    totalTrabajadores: total
  };
}
  async listByUserId(userId: number, user: UserPayload) {
    const actividades = await this.findAllByEmpresa(user, true);
    return actividades.filter(actividad => actividad.id === userId);
  }
}