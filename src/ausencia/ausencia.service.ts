import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ausencia, AusenciaEstado } from './entities/ausencia.entity';
import { CreateAusenciaDto } from './dto/create-ausencia.dto';
import { User } from 'auth/entities/user.entity';
import { UserRole } from 'auth/roles.enum';
import { UpdateAusenciaDto } from './dto/update-ausencia.dto';

@Injectable()
export class AusenciasService {
  constructor(
    @InjectRepository(Ausencia)
    private readonly ausenciaRepository: Repository<Ausencia>,
  ) {}

  async create(dto: CreateAusenciaDto, usuario: User) {
    const inicio = new Date(dto.fecha_inicio);
    const fin = new Date(dto.fecha_fin);
    
    // Cálculo de días (diferencia entre fechas + 1 para incluir el día de inicio)
    const diffTime = Math.abs(fin.getTime() - inicio.getTime());
    const diasTotales = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const nuevaAusencia = this.ausenciaRepository.create({
      ...dto,
      fecha_inicio: inicio,
      fecha_fin: fin,
      dias_totales: diasTotales,
      usuario: usuario,
    });

    return await this.ausenciaRepository.save(nuevaAusencia);
  }

  async updateEstado(id: string, estado: AusenciaEstado) {
    const ausencia = await this.ausenciaRepository.findOne({ where: { id } });
    if (!ausencia) throw new NotFoundException('Ausencia no encontrada');

    ausencia.estado = estado;
    
    // Si se aprueba, los días totales pasan a ser consumidos
    if (estado === AusenciaEstado.APROBADA) {
      ausencia.dias_consumidos = ausencia.dias_totales;
    }

    return await this.ausenciaRepository.save(ausencia);
  }

  async findAllByUsuario(usuarioId: string) {
    return await this.ausenciaRepository.find({
      where: { usuario: { id: usuarioId } },
      order: { fecha_inicio: 'DESC' }
    });
  }


  async findAll() {
    return await this.ausenciaRepository.find({
      relations: ['usuario'],
    });
  }

  async findOne(id: string, user: User) {
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

  async update(id: string, dto: UpdateAusenciaDto, user: User) {
    const ausencia = await this.findOne(id, user);
    
    // Si la ausencia ya está aprobada, no debería poder editarse
    if (ausencia.estado !== AusenciaEstado.PENDIENTE) {
      throw new ForbiddenException('No se puede modificar una ausencia ya procesada');
    }

    Object.assign(ausencia, dto);
    return await this.ausenciaRepository.save(ausencia);
  }

  async remove(id: string, user: User) {
    const ausencia = await this.findOne(id, user);
    
    if (ausencia.estado !== AusenciaEstado.PENDIENTE) {
      throw new ForbiddenException('No se puede eliminar una ausencia ya procesada');
    }

    return await this.ausenciaRepository.remove(ausencia);
  }
}