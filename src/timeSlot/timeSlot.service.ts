import { Injectable, NotFoundException, BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
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
    
    // Inyectamos esto para validar la propiedad del padre antes de crear hijos
    @InjectRepository(DistribucionDia)
    private readonly distribucionRepository: Repository<DistribucionDia>,
  ) {}

  /**
   * Crea una franja horaria.
   * Valida que el 'distribucionDiaId' pertenezca a la empresa del usuario.
   */
  async create(dto: CreateTimeSlotDto, user: UserPayload) {
    // 1. VALIDACIÓN DE PROPIEDAD (SEGURIDAD)
    // Buscamos el día y subimos hasta la empresa: Distribucion -> Schedule -> Empresa
    const distribucion = await this.distribucionRepository.findOne({
      where: { id: dto.distribucionDiaId },
      relations: ['schedule', 'schedule.empresa']
    });

    if (!distribucion) {
      throw new NotFoundException('La Distribución de Día no existe');
    }

    // Verificamos si la empresa del horario coincide con la del usuario
    if (distribucion.horario.empresa.id !== user.empresaId) {
       throw new ForbiddenException('No tienes permiso para agregar horarios en esta empresa');
    }

    // 2. Lógica horaria simple
    if (dto.inicio >= dto.fin) {
      throw new BadRequestException('La hora de inicio debe ser menor a la hora de fin');
    }

    // 3. EVITAR SOLAPAMIENTO
    // Solo buscamos en la misma distribución (que ya validamos que es nuestra)
    const choque = await this.franjaRepository.createQueryBuilder('franja')
      .where('franja.distribucionDiaId = :distId', { distId: dto.distribucionDiaId })
      .andWhere('(franja.inicio < :fin AND franja.fin > :inicio)', { 
        inicio: dto.inicio, 
        fin: dto.fin 
      })
      .getOne();

    if (choque) {
      throw new BadRequestException(`Conflicto: Ya existe una franja (${choque.inicio} - ${choque.fin})`);
    }

    // 4. Guardado
    const nuevaFranja = this.franjaRepository.create({
      ...dto,
      distribucionDia: { id: dto.distribucionDiaId } 
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
   */
  async findOne(id: number, user: UserPayload) {
    if (!user.empresaId) {
     throw new UnauthorizedException('Usuario sin empresa asignada');
  }

    const franja = await this.franjaRepository.findOne({
      where: { 
        id,
        // Seguridad: Solo devolvemos si la relación llega hasta la empresa del usuario
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
   */
  async update(id: number, dto: UpdateTimeSlotDto, user: UserPayload) {
    // 1. Buscamos y validamos propiedad
    const franja = await this.findOne(id, user);
    
    // 2. Validación de horas si vienen en el DTO
    const inicioFinal = dto.inicio ?? franja.inicio;
    const finFinal = dto.fin ?? franja.fin;

    if (inicioFinal >= finFinal) {
        throw new BadRequestException('Conflicto de horas: inicio >= fin');
    }

    // (Opcional) Aquí podrías repetir la validación de solapamiento excluyendo el ID actual
    
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

  if (!user.empresaId) {
     return []; 
     // O puedes lanzar: throw new UnauthorizedException('Usuario sin empresa');
  }
    return await this.franjaRepository.find({
      where: {
      distribucionDia: {
        // 🔴 ANTES (Error): schedule: { ... }
        // 🟢 AHORA (Correcto): Usamos el nombre real de la propiedad en la Entidad
        horario: {
          id: scheduleId,               
          empresa: { id: user.empresaId } 
        }
      }
    },
    // Si quieres devolver también los datos del horario en el JSON, añádelo aquí:
    relations: ['distribucionDia', 'distribucionDia.horario'], 
    order: {
      distribucionDia: { id: 'ASC' }, 
      inicio: 'ASC'
    }
  });
  }

}