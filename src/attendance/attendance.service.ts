import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
  ) {}

  async create(usuarioId: number, presente: boolean, motivo?: string) {
    const record = this.attendanceRepository.create({
      usuarioId,
      presente,
      motivo,
    });
    return await this.attendanceRepository.save(record);
  }

  async findAllByUser(usuarioId: number) {
    return await this.attendanceRepository.find({
      where: { usuarioId },
      order: { fecha: 'DESC' },
    });
  }
}