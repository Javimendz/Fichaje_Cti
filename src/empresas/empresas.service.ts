import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from './entities/empresa.entity';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';

@Injectable()
export class EmpresasService {
  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
  ) {}

  async create(dto: CreateEmpresaDto) {
    const empresa = this.empresaRepository.create(dto);
    return this.empresaRepository.save(empresa);
  }


  async findAll() {
    return this.empresaRepository.find({
      relations: ['usuarios', 'horarios'],
    });
  }

  async findOne(id: string) {
    const empresa = await this.empresaRepository.findOne({
      where: { id },
      relations: ['usuarios', 'horarios'],
    });

    if (!empresa) {
      throw new NotFoundException(`Empresa con id ${id} no encontrada`);
    }

    return empresa;
  }

  async update(id: string, dto: UpdateEmpresaDto) {
    const empresa = await this.findOne(id);
    Object.assign(empresa, dto);
    return this.empresaRepository.save(empresa);
  }

  async remove(id: string) {
    const empresa = await this.findOne(id);
    empresa.isActive = false;
    return this.empresaRepository.save(empresa);
  }

 async findByName(nombre: string) {
  return await this.empresaRepository.findOneBy({ nombre });
}
}