// src/allowed-user/allowed-user.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AllowedUser } from './entities/allowed-user.entity';
import { CreateAllowedUserDto } from './dto/create-allowed-user.dto';
import { User } from 'auth/entities/user.entity';
import { UserRole } from 'auth/roles.enum';

@Injectable()
export class AllowedUserService {
  constructor(
    @InjectRepository(AllowedUser)
    private readonly allowedUserRepository: Repository<AllowedUser>,
  ) {}

 
async create(dto: CreateAllowedUserDto, admin: User) {
    if (!dto.dni || !dto.telefono) throw new BadRequestException('DNI y Teléfono obligatorios');

    const newAllowedUser = this.allowedUserRepository.create({
      ...dto,
      dni: dto.dni.toUpperCase().trim(),
      empresaId: admin.empresaId, // Hereda automáticamente la empresa del admin
      rol: UserRole.WORKER,
      horarioId: null, // Nace sin horario para ser asignado después
      isVerified: false,
      isActive: true,
    } as any);

    return await this.allowedUserRepository.save(newAllowedUser);
  }

  // Listar solo los permitidos de la empresa del Admin logueado
  async findAllByEmpresa(empresaId: string) {
    if (!empresaId) return []; // Los SuperAdmin podrían no tener empresaId
    
    return await this.allowedUserRepository.find({
      where: { empresaId },
      order: { createdAt: 'DESC' }
    });
  }
  
  async findOne(id: string): Promise<AllowedUser> {
    const user = await this.allowedUserRepository.findOneBy({ id });
    
    if (!user) {
      throw new NotFoundException(`El registro con ID ${id} no existe`);
    }
    
    return user;
  }

  async update(id: string, updateDto: any) {
    // Si se actualiza el email o dni, normalizarlos
    if (updateDto.email) updateDto.email = updateDto.email.toLowerCase().trim();
    if (updateDto.dni) updateDto.dni = updateDto.dni.toUpperCase().trim();

    await this.allowedUserRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    return await this.allowedUserRepository.remove(user);
  }

async findAll() {
  return await this.allowedUserRepository.find({
    order: { createdAt: 'DESC' }
  });
}

async assignSchedule(userId: string, horarioId: string, empresaId: string) {
    // Buscamos al trabajador filtrando por la empresa del admin logueado
    const user = await this.allowedUserRepository.findOne({ 
      where: { id: userId, empresaId } 
    });

    if (!user) throw new NotFoundException('Trabajador no encontrado en su empresa');

    user.horarioId = horarioId; // Asignación directa a la columna física
    return await this.allowedUserRepository.save(user);
  }

}