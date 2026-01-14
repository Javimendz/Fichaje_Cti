// src/allowed-user/allowed-user.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AllowedUser } from './entities/allowed-user.entity';
import { CreateAllowedUserDto } from './dto/create-allowed-user.dto'; // 👈 Importa este
import { User } from 'auth/entities/user.entity';
import { UserRole } from 'auth/roles.enum';


@Injectable()
export class AllowedUserService {
  constructor(
    @InjectRepository(AllowedUser)
    private readonly allowedUserRepository: Repository<AllowedUser>,
  ) {}

  // Cambia el tipo del primer parámetro a 'CreateAllowedUserDto'
  async create(dto: CreateAllowedUserDto, admin: User) {
    
    // Verificación de duplicados
    const existing = await this.allowedUserRepository.findOne({ 
      where: { telefono: dto.telefono } 
    });
    
    if (existing) throw new BadRequestException('Este teléfono ya está registrado');

    // Mapeo manual para asegurar que no falte nada
    const newUser = this.allowedUserRepository.create({
      ...dto, // Aquí entran nombre, apellidos, dni, email, etc.
      empresaId: admin.empresaId, // Se asigna desde el admin logueado
      rol: UserRole.WORKER,
      isVerified: false,
      isActive: true,
    } as any); // Usamos 'as any' para evitar conflictos estrictos con DeepPartial

    return await this.allowedUserRepository.save(newUser);
  }

  // Método para el GET del controlador
  async findAllByEmpresa(empresaId: string) {
    return await this.allowedUserRepository.find({
      where: { empresaId },
      order: { createdAt: 'DESC' }
    });
  }
  
  // Ajusta también findOne, update y remove para recibir string (UUID)
  async findOne(id: string): Promise<AllowedUser> {
    const user = await this.allowedUserRepository.findOneBy({ id });
    
    // Validamos: Si no existe, lanzamos error y cortamos la ejecución
    if (!user) {
      throw new NotFoundException(`El usuario con ID ${id} no existe`);
    }
    
    return user;
  }

  async update(id: string, updateDto: any) {
    await this.allowedUserRepository.update(id, updateDto);
    return this.findOne(id);
  }

 async remove(id: string) {
    // 1. Usamos findOne que ya tiene la lógica de validación
    const user = await this.findOne(id);
    
    // 2. Aquí TypeScript ya sabe que 'user' es de tipo AllowedUser (no null)
    return await this.allowedUserRepository.remove(user);
  }

}