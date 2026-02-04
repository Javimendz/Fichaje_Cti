import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Horario } from './entities/schedules.entity';
import { CreateHorarioDto } from './dto/create-schedule.dto';
import { User } from '../users/entities/user.entity';
import { FranjaHoraria } from 'franja-horaria/entities/franja-horaria.entity';
import { DistribucionDia } from './entities/distribucion-dia.entity';

/**
 * SchedulesService
 * Servicio encargado de gestionar las operaciones relacionadas con los horarios.
 * Proporciona métodos para crear nuevos horarios, listar horarios por empresa,
 * obtener un horario específico y eliminar horarios.
 * Métodos principales:
 * - create: Crea un nuevo horario para una empresa.
 * - findAllByEmpresa: Lista todos los horarios asociados a una empresa.
 * - findOne: Obtiene un horario específico por su ID y empresa.
 * - remove: Elimina un horario específico.
 * @see Horario para la entidad de horarios.
 * @see CreateHorarioDto para la estructura de datos al crear un horario.
 * @see https://docs.nestjs.com/providers
 */
@Injectable() // Marca la clase como un proveedor inyectable
export class ScheduleService { // Definición del servicio SchedulesService
  constructor( 
    @InjectRepository(Horario) // Inyección del repositorio de Horario
    private readonly horarioRepository: Repository<Horario>, // Repositorio para operaciones CRUD en Horario
    @InjectRepository(DistribucionDia)
    private readonly distribucionRepository: Repository<DistribucionDia>,
    @InjectRepository(FranjaHoraria)
    private readonly franjaRepository: Repository<FranjaHoraria>,
  ) {}

  /**
   *  Crea un nuevo horario asociado a la empresa del administrador proporcionado.
   *    
   * @param dto Datos necesarios para crear el horario.
   * @param admin Usuario administrador que crea el horario.
   * @returns El horario creado.
   * @throws BadRequestException si el administrador no tiene una empresa asignada
   *         o si ocurre un error al guardar el horario.
   * @see Horario 
   * @see CreateHorarioDto  
   */
async create(dto: CreateHorarioDto, admin: User) {
  // 1. Validación de seguridad
  if (!admin.empresaId) {
    throw new BadRequestException('El administrador debe tener una empresa asignada');
  }

  // 2. Validación de integridad temporal
  const inicio = new Date(dto.fechaInicio);
  const fin = new Date(dto.fechaFin);
  if (inicio >= fin) {
    throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
  }

  // 3. Mapeo explícito (opcional pero recomendado para control total)
  const nuevoHorario = this.horarioRepository.create({
    ...dto,
    empresa: { id: admin.empresaId }, // Usar el objeto relación es más robusto que solo el ID
  });

  try {
    // Al tener cascade: true, esto guardará Horario -> Distribuciones -> Franjas
    return await this.horarioRepository.save(nuevoHorario);
  } catch (error) {
    // Manejo de errores de base de datos (ej. violación de unicidad de nombre)
    throw new BadRequestException('No se pudo guardar el esquema de horario. Verifique los datos.');
  }
}

/**
 *  Lista todos los horarios asociados a una empresa específica.
 *  
 * @param empresaId ID de la empresa cuyos horarios se desean listar.
 * @returns Lista de horarios asociados a la empresa.
 * @throws NotFoundException si no se encuentran horarios para la empresa.
 * @see Horario 
 */
  async findAllByEmpresa(empresaId: number) {
  return await this.horarioRepository.find({
    where: { empresaId, isActive: true },
    relations: ['distribuciones', 'distribuciones.franjas'],
    order: { 
      createdAt: 'DESC',
      distribuciones: { 
        id: 'ASC', // O por día de la semana si tienes ese campo
        franjas: { inicio: 'ASC' } // 👈 Muy útil: las horas salen ordenadas
      }
    }
  });
}

  /**
   *  Obtiene un horario específico por su ID y empresa.
   *  
   * @param id ID del horario a obtener.
   * @param empresaId ID de la empresa a la que pertenece el horario.
   * @returns El horario encontrado.
   * @throws NotFoundException si el horario no existe o no pertenece a la empresa.
   * @see Horario
   */
  async findOne(id: number, empresaId: number) { // Obtener un horario específico
    const horario = await this.horarioRepository.findOne({ // Buscar por ID y empresa
      where: { id, empresaId }, // Condición de búsqueda
      relations: ['distribuciones', 'distribuciones.franjas'] // Cargar relaciones necesarias
    });

    if (!horario) throw new NotFoundException(`Horario no encontrado`); // Validación de existencia
    return horario; // Retornar el horario encontrado
  }


  /**
   *  Elimina un horario específico por su ID y empresa.
   *  
   * @param id ID del horario a eliminar.
   * @param empresaId ID de la empresa a la que pertenece el horario.
   * @returns El horario eliminado.
   * @throws NotFoundException si el horario no existe o no pertenece a la empresa.
   * @see Horario
   */
// src/schedules/schedules.service.ts

async remove(id: number, empresaId: number) {
  // 1. Verificamos que existe y pertenece a la empresa
  const schedule = await this.horarioRepository.findOne({
    where: { id, empresaId },
  });

  if (!schedule) {
    throw new NotFoundException('Horario no encontrado');
  }

  // 2. Borrado físico (delete en lugar de softDelete/softRemove)
  // Al ejecutar delete, la DB ejecutará el ON DELETE CASCADE
  await this.horarioRepository.delete(id);

  return { message: 'Horario y todas sus dependencias eliminados físicamente' };
}

}