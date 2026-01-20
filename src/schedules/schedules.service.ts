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
  if (!admin.empresaId) {
    throw new BadRequestException('El administrador debe tener una empresa asignada');
  }

  // TypeORM manejará la inserción de distribuciones y franjas automáticamente 
  // por el "cascade: true" que tienes en las entidades.
  const horario = this.horarioRepository.create({
    ...dto,
    empresa: { id: admin.empresaId }, // Usamos el objeto para la relación
    empresaId: admin.empresaId,      // Y la columna para el filtro
  });

  try {
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