import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Horario } from './entities/horario.entity';
import { CreateHorarioDto } from './dto/create-schedule.dto';
import { User } from '../users/entities/user.entity';
import { AllowedUser } from 'allowed-user/entities/allowed-user.entity';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Horario)
    private readonly horarioRepository: Repository<Horario>,
   
  ) {}

  async create(dto: CreateHorarioDto, admin: User) {
    // 1. Validamos que la empresa existe (viene del admin logueado)
    if (!admin.empresaId) {
      throw new BadRequestException('El administrador no tiene una empresa asignada');
    }

    // 2. Creamos la estructura con el mapeo de relaciones
    // TypeORM detectará las distribuciones y franjas dentro del objeto
    const horario = this.horarioRepository.create({
      nombre: dto.nombre,
      tipo: dto.tipo,
      fechaInicio: new Date(dto.fechaInicio),
      fechaFin: new Date(dto.fechaFin),
      empresaId: admin.empresaId,
      
      // Mapeamos las distribuciones (Días) y sus franjas
      distribuciones: dto.distribuciones.map(dist => ({
  diaSemana: dist.diaSemana,
  horasDia: dist.horasDia, // 👈 ¡AÑADE ESTA LÍNEA!
  franjas: dist.franjas.map(franja => {
    // ... validación de horas ...
    return {
      inicio: franja.inicio,
      fin: franja.fin
    };
  })
}))
    });

    try {
      // Al guardar el horario, se guardan Días y Franjas automáticamente (Cascada)
      return await this.horarioRepository.save(horario);
    } catch (error) {
      throw new BadRequestException('Error al guardar el horario: ' + error.message);
    }
  }

  async findAllByEmpresa(empresaId: string) {
    return await this.horarioRepository.find({
      where: { empresaId, isActive: true },
      relations: ['distribuciones', 'distribuciones.franjas'], // Carga profunda
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string, empresaId: string) {
    const horario = await this.horarioRepository.findOne({
      where: { id, empresaId },
      relations: ['distribuciones', 'distribuciones.franjas']
    });

    if (!horario) throw new NotFoundException(`Horario no encontrado`);
    return horario;
  }

  async remove(id: string, empresaId: string) {
    const horario = await this.findOne(id, empresaId);
    // Debido a onDelete: 'CASCADE' en las entidades, 
    // se borrarán también sus días y franjas de la DB.
    return await this.horarioRepository.remove(horario);
  }


}