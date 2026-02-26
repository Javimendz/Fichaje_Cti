import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity  } from './entities/activity.entity';
import { CreateActividadDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Injectable()
export class ActividadService {
  constructor(
    @InjectRepository(Activity)
    private readonly actividadRepository: Repository<Activity>,
  ) {}

  // 1. CREAR UN PUESTO (Solo Admin)
  async create(empresaId: number, dto: CreateActividadDto) {
    const nuevaActividad = this.actividadRepository.create({
      empresaId,
      ...dto,
      activa: dto.activa !== undefined ? dto.activa : true, // Por defecto activa
    });
    return await this.actividadRepository.save(nuevaActividad);
  }

  // 2. LISTAR TODOS LOS PUESTOS DE LA EMPRESA
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
  async findOne(id: number, empresaId: number) {
    const actividad = await this.actividadRepository.findOne({ 
      where: { id, empresaId },
      relations: ['usuarios'] // Opcional: para ver qué trabajadores tienen este puesto
    });
    
    if (!actividad) {
      throw new NotFoundException('El puesto de trabajo no existe en tu empresa');
    }
    return actividad;
  }

  // 4. ACTUALIZAR UN PUESTO
  async update(id: number, empresaId: number, dto: UpdateActivityDto) {
    const actividad = await this.findOne(id, empresaId); // Reutilizamos findOne por seguridad
    
    Object.assign(actividad, dto);
    return await this.actividadRepository.save(actividad);
  }

  // 5. DESACTIVAR (Soft Delete) - ¡NUNCA BORRAR SI HAY TRABAJADORES ASIGNADOS!
  async desactivar(id: number, empresaId: number) {
    const actividad = await this.findOne(id, empresaId);
    
    actividad.activa = false;
    await this.actividadRepository.save(actividad);
    
    return { mensaje: `El puesto '${actividad.nombre}' ha sido desactivado correctamente.` };
  }
}