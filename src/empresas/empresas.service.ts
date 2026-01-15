// src/empresas/empresas.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from './entities/empresa.entity';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { UserRole } from 'auth/roles.enum';
import { UserPayload } from 'auth/interfaces/user-payload.interface';

@Injectable()
export class EmpresasService {
  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
  ) {}

  async create(dto: CreateEmpresaDto) {
    const empresa = this.empresaRepository.create(dto);
    return await this.empresaRepository.save(empresa);
  }

  async findAll(user: UserPayload) {
  // 1. Si es SUPERADMIN, no aplicamos filtro de ID
  if (user.rol === UserRole.SUPERADMIN) {
    return await this.empresaRepository.find({
      where: { isActive: true },
      relations: ['usuarios', 'horarios'],
    });
  }

  // 2. Si es ADMIN, garantizamos que el ID no sea null antes de la consulta
  if (!user.empresaId) {
    return []; // O lanzar una excepción si un Admin no tiene empresa
  }

  const empresa = await this.empresaRepository.findOne({
    where: { 
      id: user.empresaId, // Aquí TS ya sabe que NO es null
      isActive: true 
    },
    relations: ['usuarios', 'horarios'],
  });

  return empresa ? [empresa] : [];
}

  async findOne(id: string, user: UserPayload) {
    // Seguridad: Si no es Superadmin y el ID no coincide con su empresa, bloqueamos
    if (user.rol !== UserRole.SUPERADMIN && user.empresaId !== id) {
      throw new ForbiddenException('No tienes permiso para ver esta empresa');
    }

    const empresa = await this.empresaRepository.findOne({
      where: { id, isActive: true },
      relations: ['usuarios', 'horarios'],
    });

    if (!empresa) {
      throw new NotFoundException(`Empresa con ID ${id} no encontrada`);
    }

    return empresa;
  }

  async update(id: string, dto: UpdateEmpresaDto) {
    const empresa = await this.empresaRepository.findOneBy({ id });
    if (!empresa) throw new NotFoundException('Empresa no encontrada');
    
    Object.assign(empresa, dto);
    return await this.empresaRepository.save(empresa);
  }

  async remove(id: string) {
    const empresa = await this.empresaRepository.findOneBy({ id });
    if (!empresa) throw new NotFoundException('Empresa no encontrada');

    empresa.isActive = false; // Soft delete
    return await this.empresaRepository.save(empresa);
  }

  async findByName(nombre: string) {
    return await this.empresaRepository.findOneBy({ nombre });
  }
}