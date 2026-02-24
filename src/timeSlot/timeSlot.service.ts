import { Injectable, NotFoundException, BadRequestException, ForbiddenException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FranjaHoraria } from './entities/franja-horaria.entity';
import { DistribucionDia } from '../schedule/entities/distribucion-dia.entity'; // Asegúrate de importar esto
import { CreateTimeSlotDto } from './dto/create-timeSlot.dto';
import { UpdateTimeSlotDto } from './dto/update-timeSlot.dto';
import type { UserPayload } from '../auth/interfaces/user-payload.interface'; // Import type para evitar ciclos


// 🟢 TimeSlotService
// Servicio para gestionar la lógica de negocio relacionada con las franjas horarias (time slots) de los horarios de trabajo.
/**
 * TimeSlotService
 * Servicio para gestionar la lógica de negocio relacionada con las franjas horarias (time slots) de los horarios de trabajo.
 * Incluye métodos para crear, listar, buscar, actualizar y eliminar franjas horarias, asegurando que todas las operaciones estén vinculadas a la empresa del usuario autenticado para mantener la seguridad y la integridad de los datos.
 * El método create permite a un administrador crear una nueva franja horaria para un día específico, validando que el horario no tenga solapamientos con otras franjas del mismo día.
 * El método findAll devuelve todas las franjas horarias asociadas a la empresa del usuario autenticado, ordenadas por hora de inicio.
 * El método findOne busca una franja horaria específica por su ID, asegurando que pertenezca a la empresa del usuario antes de devolverla.
 * El método update permite actualizar una franja horaria existente, validando que el nuevo horario no tenga conflictos con otras franjas del mismo día.
 * El método remove elimina una franja horaria específica, asegurando que pertenezca a la empresa del usuario antes de eliminarla de la base de datos.
 * Este servicio es esencial para la gestión de los horarios de trabajo en la empresa, ya que permite a los administradores controlar las franjas horarias disponibles para cada día y asegurar que no haya solapamientos que puedan generar conflictos en la planificación.
 * */ 
@Injectable()
export class TimeSlotService {
  constructor(
    @InjectRepository(FranjaHoraria)
    private readonly franjaRepository: Repository<FranjaHoraria>,
    
    @InjectRepository(DistribucionDia)
    private readonly distribucionRepository: Repository<DistribucionDia>,
  ) {}

  // --- CREAR: SOLO ADMIN ---  
  /* Método para crear una franja horaria.
    * Valida que el 'distribucionDiaId' pertenezca a la empresa del usuario.
    * Valida que la hora de inicio sea menor a la hora de fin.
    * Valida que no haya solapamientos con otras franjas del mismo día. 
    * Si todo es correcto, guarda la franja en la base de datos.
    * Solo los usuarios con rol ADMIN pueden acceder a este método para crear franjas horarias, asegurando que la gestión de los horarios de trabajo esté controlada por personal autorizado y evitando que los trabajadores puedan modificar la estructura de los turnos, lo que podría generar conflictos y desorganización en la planificación.
    * @Roles(UserRole.ADMIN) garantiza que solo los administradores puedan acceder a este método, manteniendo la seguridad y el control sobre la gestión de los horarios de trabajo en la empresa.
    * El sistema registra una entrada de auditoría cada vez que se crea una franja horaria, incluyendo el correo electrónico del administrador que realizó la acción y el ID de la franja creada, lo que ayuda a mantener un historial de cambios y mejorar la trazabilidad de las acciones administrativas.
    */
  private async checkOverlap(distId: number, inicio: string, fin: string | null | undefined, excludeId?: number) {
    // Si no hay hora de fin, asumimos el final del día para la validación matemática
    const finCalculado = fin || '23:59:59';
    
    const query = this.franjaRepository.createQueryBuilder('franja')
      .where('franja.distribucionDia = :distId', { distId }) 
      // Usamos COALESCE en SQL para manejar las franjas de la BD que no tengan hora de fin
      .andWhere('(franja.inicio < :fin AND COALESCE(franja.fin, \'23:59:59\') > :inicio)', { 
        inicio, 
        fin: finCalculado 
      });

    // Si estamos actualizando, excluimos la franja actual de la colisión
    if (excludeId) {
      query.andWhere('franja.id != :excludeId', { excludeId });
    }

    const choque = await query.getOne();
    if (choque) {
      throw new BadRequestException(`Conflicto de horario: Ya existe una franja de ${choque.inicio} a ${choque.fin || 'indefinido'}`);
    }
  }


  /**
   * Crea una franja horaria.
   * Valida que el 'distribucionDiaId' pertenezca a la empresa del usuario.
   * Valida que la hora de inicio sea menor a la hora de fin.
   * Valida que no haya solapamientos con otras franjas del mismo día.
   * Si todo es correcto, guarda la franja en la base de datos.
   * @param dto - Datos para crear la franja horaria
   * @param user - Información del usuario autenticado (para validar empresa)
   * @returns La franja horaria creada
   * @throws BadRequestException, NotFoundException, ForbiddenException, InternalServerErrorException
   */
 async create(dto: CreateTimeSlotDto, user: UserPayload) {
    const distribucion = await this.distribucionRepository.findOne({
      where: { id: dto.distribucionDiaId },
      relations: ['horario', 'horario.empresa'] 
    });

    if (!distribucion) throw new NotFoundException('La Distribución de Día no existe');
    if (!distribucion.horario || !distribucion.horario.empresa) {
       throw new InternalServerErrorException('Error de integridad: El día no tiene horario o empresa asociada');
    }
    if (distribucion.horario.empresa.id !== user.empresaId) {
       throw new ForbiddenException('No tienes permiso para modificar este horario');
    }

    if (dto.fin && dto.inicio >= dto.fin) {
      throw new BadRequestException('La hora de inicio debe ser anterior a la hora de fin.');
    }

    await this.checkOverlap(dto.distribucionDiaId, dto.inicio, dto.fin);

    const nuevaFranja = this.franjaRepository.create({
      inicio: dto.inicio,
      fin: dto.fin,
      distribucionDia: { id: dto.distribucionDiaId }
    });

    return await this.franjaRepository.save(nuevaFranja);
  }
  /**
   * Lista TODAS las franjas de la empresa del usuario.
   * (Útil para reportes, aunque suele usarse más por día o schedule)
   */
  /* Endpoint para listar todas las franjas horarias de la empresa del usuario.

    * El sistema devuelve todas las franjas horarias asociadas a la empresa del usuario autenticado, ordenadas por hora de inicio (más temprano primero).
    * Solo los usuarios con rol ADMIN o WORKER pueden acceder a este endpoint para listar las franjas horarias, asegurando que los trabajadores puedan revisar las franjas de su empresa mientras se mantiene la seguridad y privacidad de los datos.
    * @Roles(UserRole.ADMIN, UserRole.WORKER) garantiza que tanto los administradores como los trabajadores puedan acceder a este endpoint, permitiendo a los trabajadores revisar las franjas de su empresa mientras se mantiene la seguridad y privacidad de los datos.
    */
  async findAll(user: UserPayload) {
    if (!user.empresaId) {
    return [];
  }
    return await this.franjaRepository.find({
      where: {
        // Filtro Profundo: Franja -> Distribucion -> Schedule -> Empresa = User.Empresa
        distribucionDia: {
          horario: {
            empresa: { id: user.empresaId }
          }
        }
      },
      relations: ['distribucionDia'], 
      order: { inicio: 'ASC' }
    });
  }

  /**
   * Busca una franja específica asegurando que pertenezca a la empresa.
   * Si no se encuentra o no pertenece, lanza NotFoundException.
   * Si el usuario no tiene empresa asignada, lanza UnauthorizedException.
   * @returns La franja horaria encontrada
   * 
   */
  async findOne(id: number, user: UserPayload) {
    if (!user.empresaId) throw new UnauthorizedException('Usuario sin empresa asignada');

    const franja = await this.franjaRepository.findOne({
      where: { 
        id,
        distribucionDia: { horario: { empresa: { id: user.empresaId } } }
      },
      relations: ['distribucionDia', 'distribucionDia.horario'],
    });

    if (!franja) throw new NotFoundException(`Franja no encontrada o acceso denegado`);
    return franja;
  }

  

  /**
   * Actualiza una franja. Reutiliza findOne para asegurar la propiedad.
   * Valida que el nuevo horario no tenga conflictos si se modifican las horas.
   * @returns La franja actualizada
   * 
   */
  async update(id: number, dto: UpdateTimeSlotDto, user: UserPayload) {
    const franja = await this.findOne(id, user);
    
    const inicioFinal = dto.inicio ?? franja.inicio;
    const finFinal = dto.fin !== undefined ? dto.fin : franja.fin; // Manejo de nulos vs undefined

    if (finFinal && inicioFinal >= finFinal) {
        throw new BadRequestException('Conflicto de horas: inicio >= fin');
    }

    // 🛡️ CORRECCIÓN CRÍTICA: Validamos colisiones en el Update excluyendo el ID actual
    await this.checkOverlap(franja.distribucionDia.id, inicioFinal, finFinal, id);

    Object.assign(franja, dto);
    return await this.franjaRepository.save(franja);
  }

  /**
   * Elimina una franja. Reutiliza findOne para asegurar la propiedad.
   */
  async remove(id: number, user: UserPayload) {
    const franja = await this.findOne(id, user); // Si no es suya, findOne lanza excepción
    await this.franjaRepository.remove(franja);
    return { message: 'Franja eliminada correctamente' };
  }

async findAllBySchedule(scheduleId: number, user: UserPayload) {
    if (!user.empresaId) return [];

    return await this.franjaRepository.find({
      where: {
        distribucionDia: {
          horario: {
            id: scheduleId,
            empresa: { id: user.empresaId } // Filtro de seguridad
          }
        }
      },
      relations: ['distribucionDia'],
      order: {
        distribucionDia: { id: 'ASC' }, // Ordenar por día (Lunes, Martes...)
        inicio: 'ASC' // Ordenar por hora
      }
    });
  }
}