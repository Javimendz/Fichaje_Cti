import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FranjaHoraria } from './entities/franja-horaria.entity';
import { CreateFranjaHorariaDto } from './dto/create-franja-horaria.dto';
import { DistribucionDia } from 'schedules/entities/distribucion-dia.entity';

@Injectable()
export class FranjasHorariasService {
  constructor(
    @InjectRepository(FranjaHoraria)
    private readonly franjaRepository: Repository<FranjaHoraria>,
    @InjectRepository(DistribucionDia)
    private readonly distRepository: Repository<DistribucionDia>,
  ) {}

  async create(dto: CreateFranjaHorariaDto) {
    const distribucion = await this.distRepository.findOneBy({ id: dto.distribucionDiaId });
    
    if (!distribucion) {
      throw new NotFoundException('La Distribución de Día no existe');
    }

    const nuevaFranja = this.franjaRepository.create({
      inicio: dto.inicio,
      fin: dto.fin,
      distribucionDia: distribucion
    });

    return await this.franjaRepository.save(nuevaFranja);
  }

  async findAllByDistribucion(distId: string) {
    return await this.franjaRepository.find({
      where: { distribucionDia: { id: distId } },
      order: { inicio: 'ASC' }
    });
  }

  async findAll() {
    return await this.franjaRepository.find({
      relations: ['distribucionDia'],
    });
  }

  async findOne(id: string) {
    const franja = await this.franjaRepository.findOne({
      where: { id },
      relations: ['distribucionDia'],
    });
    if (!franja) throw new NotFoundException(`Franja con ID ${id} no encontrada`);
    return franja;
  }

  async update(id: string, dto: Partial<CreateFranjaHorariaDto>) {
    const franja = await this.findOne(id);
    Object.assign(franja, dto);
    return await this.franjaRepository.save(franja);
  }

  async remove(id: string) {
    const franja = await this.findOne(id);
    return await this.franjaRepository.remove(franja);
  }
}