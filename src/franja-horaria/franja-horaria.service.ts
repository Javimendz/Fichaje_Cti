import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FranjaHoraria } from './entities/franja-horaria.entity';
import { CreateFranjaHorariaDto } from './dto/create-franja-horaria.dto';

@Injectable()
export class FranjasHorariasService {
  constructor(
    @InjectRepository(FranjaHoraria)
    private readonly franjaRepository: Repository<FranjaHoraria>,
    // Quitamos distRepository si usamos la carga por ID directo (más rápido)
  ) {}

  async create(dto: CreateFranjaHorariaDto) {
    // 1. Validación de lógica horaria (Imprescindible)
    if (dto.inicio >= dto.fin) {
      throw new BadRequestException('La hora de inicio debe ser menor a la hora de fin');
    }

    // 2. Creación eficiente
    // No necesitas buscar la DistribucionDia en la DB primero. 
    // TypeORM puede crear la relación usando solo el ID.
    const nuevaFranja = this.franjaRepository.create({
      inicio: dto.inicio,
      fin: dto.fin,
      distribucionDia: { id: dto.distribucionDiaId } 
    });

    try {
      return await this.franjaRepository.save(nuevaFranja);
    } catch (error) {
      // Si el UUID de la distribución no existe, saltará el error de FK aquí
      throw new BadRequestException('La Distribución de Día no existe o el ID es inválido');
    }
  }

  async findAll() {
  return await this.franjaRepository.find({
    relations: ['distribucionDia'], // Esto cargará la info del día al que pertenece
    order: { inicio: 'ASC' }
  });
}

  async findAllByDistribucion(distId: string) {
    return await this.franjaRepository.find({
      where: { distribucionDia: { id: distId } },
      order: { inicio: 'ASC' } // Siempre útil devolver las horas ordenadas
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
    
    // Si se actualizan horas, re-validar
    const inicioFinal = dto.inicio || franja.inicio;
    const finFinal = dto.fin || franja.fin;
    if (inicioFinal >= finFinal) {
        throw new BadRequestException('Conflicto de horas: inicio >= fin');
    }

    Object.assign(franja, dto);
    return await this.franjaRepository.save(franja);
  }

  async remove(id: string) {
    const franja = await this.findOne(id);
    await this.franjaRepository.remove(franja);
    return { message: 'Franja eliminada correctamente' };
  }
}