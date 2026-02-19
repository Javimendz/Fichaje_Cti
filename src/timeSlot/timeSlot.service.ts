import { Injectable, NotFoundException, BadRequestException, ForbiddenException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FranjaHoraria } from './entities/franja-horaria.entity';
import { DistribucionDia } from '../schedule/entities/distribucion-dia.entity'; // Asegúrate de importar esto
import { CreateTimeSlotDto } from './dto/create-timeSlot.dto';
import { UpdateTimeSlotDto } from './dto/update-timeSlot.dto';
import type { UserPayload } from '../auth/interfaces/user-payload.interface'; // Import type para evitar ciclos

@Injectable()
export class TimeSlotService {
  constructor(
    @InjectRepository(FranjaHoraria)
    private readonly franjaRepository: Repository<FranjaHoraria>,
    
    @InjectRepository(DistribucionDia)
    private readonly distribucionRepository: Repository<DistribucionDia>,
  ) {}

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

    if (!distribucion) {
      throw new NotFoundException('La Distribución de Día no existe');
    }

    
    if (!distribucion.horario || !distribucion.horario.empresa) {
       throw new InternalServerErrorException('Error de integridad: El día no tiene horario o empresa asociada');
    }

    
    if (distribucion.horario.empresa.id !== user.empresaId) {
       throw new ForbiddenException('No tienes permiso para modificar este horario');
    }

   
    // 2. Lógica horaria
    if (dto.fin && dto.inicio >= dto.fin) {
      throw new BadRequestException('La hora de inicio debe ser anterior a la hora de fin.');
    }

    // 3. EVITAR SOLAPAMIENTO 
    // Buscamos si hay alguna franja que se cruce con la nueva
    const choque = await this.franjaRepository.createQueryBuilder('franja')
      .where('franja.distribucion_dia_id = :distId', { distId: dto.distribucionDiaId }) // Usa el nombre de la columna DB o la propiedad
      .andWhere('(franja.inicio < :fin AND franja.fin > :inicio)', { 
        inicio: dto.inicio, 
        fin: dto.fin 
      })
      .getOne();

    if (choque) {
      throw new BadRequestException(`Conflicto de horario: Ya existe una franja de ${choque.inicio} a ${choque.fin}`);
    }

    // 4. Guardado
    const nuevaFranja = this.franjaRepository.create({
      inicio: dto.inicio,
      fin: dto.fin,
      distribucionDia: { id: dto.distribucionDiaId } // TypeORM usará esto para el INSERT
    });

    return await this.franjaRepository.save(nuevaFranja);
  }
  /**
   * Lista TODAS las franjas de la empresa del usuario.
   * (Útil para reportes, aunque suele usarse más por día o schedule)
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
    if (!user.empresaId) {
     throw new UnauthorizedException('Usuario sin empresa asignada');
  }

    const franja = await this.franjaRepository.findOne({
      where: { 
        id,
        distribucionDia: {
          horario: {
            empresa: { id: user.empresaId }
          }
        }
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
    // 1. Buscamos y validamos propiedad
    const franja = await this.findOne(id, user);
    
    // 2. Validación de horas si vienen en el DTO
    const inicioFinal = dto.inicio ?? franja.inicio;
    const finFinal = dto.fin ?? franja.fin;

    if (finFinal && inicioFinal >= finFinal) {
        throw new BadRequestException('Conflicto de horas: inicio >= fin');
    }

    
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