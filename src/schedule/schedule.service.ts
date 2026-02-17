import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, DataSource } from 'typeorm'; // 👈 Importamos DataSource
import { Horario } from './entities/schedules.entity';
import { CreateHorarioDto } from './dto/create-schedule.dto';
import type { UserPayload } from '../auth/interfaces/user-payload.interface'; 
import { FranjaHoraria } from 'timeSlot/entities/franja-horaria.entity';
import { DistribucionDia } from './entities/distribucion-dia.entity';
import { User } from '../auth/entities/user.entity'; // Asegúrate de importar User

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Horario)
    private readonly horarioRepository: Repository<Horario>,
  ) {}

async create(dto: CreateHorarioDto, user: UserPayload) {
  // 1. VALIDACIÓN DE EMPRESA
  if (!user.empresaId) {
    throw new BadRequestException('El usuario debe tener una empresa asignada.');
  }

  // 2. CONVERSIÓN Y VALIDACIÓN DE FECHAS
  const fechaInicio = new Date(dto.fechaInicio);
  const fechaFin = new Date(dto.fechaFin);

  if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
    throw new BadRequestException('Las fechas proporcionadas no son válidas.');
  }

  if (fechaInicio >= fechaFin) {
    throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin.');
  }

  // 3. CREACIÓN DEL OBJETO EN MEMORIA (DeepPartial)
  // TypeORM creará las instancias de DistribucionDia y FranjaHoraria automáticamente
  const nuevoHorario = this.horarioRepository.create({
    ...dto,
    fechaInicio,
    fechaFin,
    isActive: true,
    empresa: { id: user.empresaId },
  } as DeepPartial<Horario>);

  // 4. VINCULACIÓN MANUAL (Obligatorio para evitar 'null value in horario_id')
  // Establecemos las referencias de los hijos hacia los padres en memoria
  if (nuevoHorario.distribuciones) {
    nuevoHorario.distribuciones.forEach((dist) => {
      dist.horario = nuevoHorario; // Relación Hijo -> Padre

      if (dist.franjas) {
        dist.franjas.forEach((franja) => {
          franja.distribucionDia = dist; // Relación Nieto -> Hijo
        });
      }
    });
  }

  try {
    // 5. GUARDADO EN BASE DE DATOS
    // Guardamos el objeto con las referencias circulares (necesario para el cascade insert)
    const guardado = await this.horarioRepository.save(nuevoHorario);

    // 6. RETORNO SEGURO (RECARGA DESDE DB)
    // Al buscarlo de nuevo con findOne, TypeORM genera objetos NUEVOS.
    // Como no pedimos la relación inversa en 'relations', el bucle se rompe aquí.
    return await this.horarioRepository.findOne({
      where: { id: guardado.id },
      relations: ['distribuciones', 'distribuciones.franjas'],
      order: {
        distribuciones: {
          id: 'ASC',
          franjas: { inicio: 'ASC' }
        }
      }
    });

  } catch (error) {
    // Capturamos cualquier error de base de datos (nombres duplicados, etc.)
    throw new BadRequestException(`No se pudo crear el horario: ${error.message}`);
  }
}


  async findAllByEmpresa(empresaId: number) {
    return await this.horarioRepository.find({
      where: { empresa: { id: empresaId }, isActive: true },
      relations: ['distribuciones', 'distribuciones.franjas'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number, empresaId: number) {
    const horario = await this.horarioRepository.findOne({
      where: { id, empresa: { id: empresaId } },
      relations: ['distribuciones', 'distribuciones.franjas']
    });

    if (!horario) throw new NotFoundException(`Horario no encontrado o no tienes acceso`);
    return horario;
  }

  async remove(id: number, empresaId: number) {
    await this.findOne(id, empresaId);
    const result = await this.horarioRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('No se pudo eliminar el horario');
    return { message: 'Horario eliminado correctamente' };
  }
}