import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FranjaHoraria } from './entities/franja-horaria.entity';
import { CreateFranjaHorariaDto } from './dto/create-franja-horaria.dto';

@Injectable()
export class FranjaHorariaService {
  constructor(
    @InjectRepository(FranjaHoraria)
    private readonly franjaRepository: Repository<FranjaHoraria>,
    // Quitamos distRepository si usamos la carga por ID directo (más rápido)
  ) {}

  async create(dto: CreateFranjaHorariaDto) {
    // 1. Validación de lógica horaria simple
    if (dto.inicio >= dto.fin) {
      throw new BadRequestException('La hora de inicio debe ser menor a la hora de fin');
    }

    // 2. EVITAR SOLAPAMIENTO (OPCIONAL pero recomendado)
    // Buscamos si ya existe una franja que choque con el nuevo horario en esa misma distribución
    const choque = await this.franjaRepository.createQueryBuilder('franja')
      .where('franja.distribucionDiaId = :distId', { distId: dto.distribucionDiaId })
      .andWhere('(franja.inicio < :fin AND franja.fin > :inicio)', { 
        inicio: dto.inicio, 
        fin: dto.fin 
      })
      .getOne();

    if (choque) {
      throw new BadRequestException(`El horario solapa con una franja existente (${choque.inicio} - ${choque.fin})`);
    }

    const nuevaFranja = this.franjaRepository.create({
      ...dto,
      distribucionDia: { id: dto.distribucionDiaId } 
    });

    try {
      return await this.franjaRepository.save(nuevaFranja);
    } catch (error) {
      // Error de Foreign Key (la distribución no existe en la DB)
      throw new BadRequestException('La Distribución de Día no existe');
    }
  }
  async findAll() {
  return await this.franjaRepository.find({
    relations: ['distribucionDia'], // Esto cargará la info del día al que pertenece
    order: { inicio: 'ASC' }
  });
}

  async findAllByDistribucion(distId: number) {
    return await this.franjaRepository.find({
      where: { distribucionDia: { id: distId } },
      order: { inicio: 'ASC' } // Siempre útil devolver las horas ordenadas
    });
  }

  async findOne(id: number) {
    const franja = await this.franjaRepository.findOne({
      where: { id },
      relations: ['distribucionDia'],
    });
    if (!franja) throw new NotFoundException(`Franja con ID ${id} no encontrada`);
    return franja;
  }

 async update(id: number, dto: Partial<CreateFranjaHorariaDto>) {
    const franja = await this.findOne(id);
    
    const inicioFinal = dto.inicio || franja.inicio;
    const finFinal = dto.fin || franja.fin;

    if (inicioFinal >= finFinal) {
        throw new BadRequestException('Conflicto de horas: inicio >= fin');
    }

    // Nota: Si implementas el check de solapamiento, aquí deberías 
    // excluir el ID actual de la búsqueda para que no choque consigo misma.

    Object.assign(franja, dto);
    return await this.franjaRepository.save(franja);
  }

  async remove(id: number) {
    const franja = await this.findOne(id);
    await this.franjaRepository.remove(franja);
    return { message: 'Franja eliminada correctamente' };
  }
}