import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MoreThan, Repository } from 'typeorm';
import { Issue } from './entities/issue.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateIncidenciaDto } from './dto/create-issue.dto';
import { UpdateIncidenciaDto } from './dto/update-issue.dto';

@Injectable()
export class IssueService {
  constructor(
    @InjectRepository(Issue)
    private readonly incidenciaRepository: Repository<Issue>,
  ) {}

  // ===============================
  // CREAR INCIDENCIA
  // ===============================

  async create(
    userId: number,
    empresaId: number,
    dto: CreateIncidenciaDto,
  ) {
    const haceQuinceMinutos = new Date(Date.now() - 15 * 60 * 1000);

    // Evitar spam cada 15 min
    const ultimaIncidencia = await this.incidenciaRepository.findOne({
      where: {
        userId,
        empresaId,
        createdAt: MoreThan(haceQuinceMinutos),
      },
      order: { createdAt: 'DESC' },
    });

    if (ultimaIncidencia) {
      throw new BadRequestException(
        'Espera 15 minutos antes de crear otra incidencia.',
      );
    }

    // Evitar duplicado mismo tipo en el mismo día
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);

    const incidenciaHoy = await this.incidenciaRepository.findOne({
      where: {
        userId,
        empresaId,
        tipo: dto.tipo,
        createdAt: MoreThan(inicioHoy),
      },
    });

    if (incidenciaHoy) {
      throw new BadRequestException(
        'Ya existe una incidencia de este tipo hoy.',
      );
    }

    const incidencia = this.incidenciaRepository.create({
      userId,
      empresaId,
      ...dto,
      resuelta: false,
    });

    return this.incidenciaRepository.save(incidencia);
  }

  // ===============================
  // CONSULTAS
  // ===============================

  findAll() {
    return this.incidenciaRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  findAllByUsuario(userId: number) {
    return this.incidenciaRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, empresaId: number) {
    const incidencia = await this.incidenciaRepository.findOne({
      where: { id, empresaId },
    });

    if (!incidencia) {
      throw new NotFoundException('Incidencia no encontrada');
    }

    return incidencia;
  }

  async findAllByEmpresa(
    empresaId: number,
    soloPendientes = false,
  ) {
    const where: any = { empresaId };

    if (soloPendientes) {
      where.resuelta = false;
    }

    return this.incidenciaRepository.find({
      where,
      relations: ['usuario'],
      order: { createdAt: 'DESC' },
    });
  }

  // ===============================
  // UPDATE / DELETE
  // ===============================

  async update(
    id: number,
    empresaId: number,
    updateDto: UpdateIncidenciaDto,
  ) {
    const incidencia = await this.findOne(id, empresaId);

    Object.assign(incidencia, updateDto);

    return this.incidenciaRepository.save(incidencia);
  }

  async remove(id: number, empresaId: number) {
    const incidencia = await this.findOne(id, empresaId);
    return this.incidenciaRepository.remove(incidencia);
  }

  async resolver(id: number, empresaId: number) {
    const incidencia = await this.findOne(id, empresaId);

    incidencia.resuelta = true;

    return this.incidenciaRepository.save(incidencia);
  }
}
