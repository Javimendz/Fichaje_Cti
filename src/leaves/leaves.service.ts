import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Leave, LeaveStatus } from "./entities/leaf.entity";
import { Repository } from "typeorm";
import { CreateLeaveRangeDto } from "./dto/create-leaf.dto";

@Injectable()
export class LeavesService {
  constructor(
    @InjectRepository(Leave)
    private readonly leaveRepository: Repository<Leave>,
  ) {}

  async createRange(dto: CreateLeaveRangeDto) {
    const inicio = new Date(dto.fechaInicio);
    const fin = new Date(dto.fechaFin);
    const registros: Leave[] = [];
    // Bucle para recorrer cada día del rango
    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
      const nuevaFecha = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
      
      const leave = this.leaveRepository.create({
        usuarioId: dto.usuarioId,
        fecha: nuevaFecha,
        tipo: dto.tipo,
        estado: LeaveStatus.APPROVED // Los admins las crean aprobadas por defecto
      });
      registros.push(leave);
    }

    return await this.leaveRepository.save(registros);
  }

  async findAllByUser(usuarioId: number) {
  return await this.leaveRepository.find({
    where: { usuarioId },
    order: { fecha: 'ASC' }
  });
}
}