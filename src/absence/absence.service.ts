import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ausencia, AusenciaEstado } from './entities/ausencia.entity';
import { CreateAbsenceDto } from './dto/create-absence.dto';

import { UserRole } from 'auth/roles.enum';
import { UpdateAbsenceDto } from './dto/update-absence.dto';
import { User } from 'auth/entities/user.entity';

@Injectable()
export class AbsenceService {
  constructor(
    @InjectRepository(Ausencia)
    private readonly ausenciaRepository: Repository<Ausencia>,
  ) {}

  async create(dto: CreateAbsenceDto, usuario: User) {
    const inicio = new Date(dto.fecha_inicio);
    const fin = new Date(dto.fecha_fin);
    


    // Cálculo de días
    const diffTime = Math.abs(fin.getTime() - inicio.getTime());
    const diasTotales = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

if (!usuario.empresaId) {
    throw new BadRequestException('El usuario debe estar vinculado a una empresa para registrar ausencias.');
  }

    const nuevaAusencia = this.ausenciaRepository.create({
      ...dto,
      fechaInicio: inicio, 
      fechaFin: fin,       
      diasTotales: diasTotales, 
      usuarioId: usuario.id,
      empresaId: usuario.empresaId,
    });

    return await this.ausenciaRepository.save(nuevaAusencia);
  
  }

async updateEstado(id: number, estado: AusenciaEstado, admin: User) {
  const ausencia = await this.ausenciaRepository.findOne({ where: { id } });
  if (!ausencia) throw new NotFoundException('Ausencia no encontrada');

  ausencia.estado = estado;
  ausencia.diasConsumidos = estado === AusenciaEstado.APROBADA ? ausencia.diasTotales : 0;
  ausencia.motivo = `${ausencia.motivo || ''} (Procesado por: ${admin.nombre || 'Admin'})`.trim();

  return await this.ausenciaRepository.save(ausencia);
}

  async findAllByUsuario(usuarioId: number) {
    return await this.ausenciaRepository.find({
      where: { usuario: { id: usuarioId } },
      order: { fechaInicio: 'DESC' }
    });
  }


  async findAll() {
    return await this.ausenciaRepository.find({
      relations: ['usuario'],
    });
  }

  async findOne(id: number, user: User) {
    const ausencia = await this.ausenciaRepository.findOne({
      where: { id },
      relations: ['usuario'],
    });

    if (!ausencia) throw new NotFoundException('Ausencia no encontrada');

    // Validación de seguridad: solo el dueño o un admin pueden verla
    if (user.rol !== UserRole.SUPERADMIN && ausencia.usuario.id !== user.id) {
       throw new ForbiddenException('No tienes permiso para ver esta ausencia');
    }

    return ausencia;
  }

  async update(id: number, dto: UpdateAbsenceDto, user: User) {
    const ausencia = await this.findOne(id, user);
    
    // Si la ausencia ya está aprobada, no debería poder editarse
    if (ausencia.estado !== AusenciaEstado.PENDIENTE) {
      throw new ForbiddenException('No se puede modificar una ausencia ya procesada');
    }

    Object.assign(ausencia, dto);
    return await this.ausenciaRepository.save(ausencia);
  }

  async remove(id: number, user: User) {
    const ausencia = await this.findOne(id, user);
    
    if (ausencia.estado !== AusenciaEstado.PENDIENTE) {
      throw new ForbiddenException('No se puede eliminar una ausencia ya procesada');
    }

    return await this.ausenciaRepository.remove(ausencia);
  }
}