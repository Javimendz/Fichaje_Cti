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
    // TypeORM es inteligente:
    // Al pasar { usuario: { id: usuarioId } }, crea la relación sin buscar al usuario entero.
    const record = this.attendanceRepository.create({
      presente: dto.presente,
      motivo: dto.motivo,
      usuario: { id: usuarioId } as any // Vinculación directa por ID
    });
    
    return await this.attendanceRepository.save(record);
  }

  async findAllByUser(usuarioId: number) {
    return await this.attendanceRepository.find({
      where: { usuario: { id: usuarioId } }, // Filtramos por relación
      order: { fecha: 'DESC' },
    });
  }
}