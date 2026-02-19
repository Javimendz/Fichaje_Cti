import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { CreateAttendanceDto } from './dto/create-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
  ) {}

  async create(usuarioId: number, dto: CreateAttendanceDto) {
    const record = this.attendanceRepository.create({
      presente: dto.presente,
      motivo: dto.motivo,
      usuario: { id: usuarioId } as any // Vinculación directa por ID
      // Si en la entidad tienes 'empresaId', deberías pasarlo aquí también para facilitar las búsquedas
    });
    
    return await this.attendanceRepository.save(record);
  }

  async findAllByUser(usuarioId: number) {
    return await this.attendanceRepository.find({
      where: { usuario: { id: usuarioId } },
      order: { fecha: 'DESC' }, // Asumo que tienes un campo 'fecha' o 'createdAt'
    });
  }

  // 🟢 NUEVO: Busca todos los fichajes de una empresa
  async findAllByEmpresa(empresaId: number) {
    return await this.attendanceRepository.find({
      // Hacemos un JOIN con el usuario para filtrar por su empresaId
      where: { 
        usuario: { empresaId: empresaId } 
      },
      relations: ['usuario'], // Traemos el usuario para que el admin sepa quién fichó
      order: { fecha: 'DESC' }, 
    });
  }
}