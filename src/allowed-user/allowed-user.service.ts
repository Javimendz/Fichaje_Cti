// src/allowed-user/allowed-user.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AllowedUser } from './entities/allowed-user.entity';
import { CreateAllowedUserDto } from './dto/create-allowed-user.dto';
import { User } from 'auth/entities/user.entity';
import { UserRole } from 'auth/roles.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AllowedUserService {
  constructor(
    @InjectRepository(AllowedUser)
    private readonly allowedUserRepository: Repository<AllowedUser>,
    
  private readonly dataSource: DataSource,
  ) {}

async create(dto: CreateAllowedUserDto, admin: User) {
  // 1. Validación de seguridad para TS (Garantiza que empresaId no es null)
  if (!admin.empresaId) {
    throw new BadRequestException('El administrador debe tener una empresa asignada');
  }

  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 2. Usamos el ID validado para evitar el error de "string | null"
    const empresaIdValido: string = admin.empresaId;

    // Crear el registro en AllowedUser
    const newAllowedUser = queryRunner.manager.create(AllowedUser, {
      nombre: dto.nombre,
      email: dto.email,
      telefono: dto.telefono,
      dni: dto.dni.toUpperCase().trim(),
      empresaId: empresaIdValido, // Ahora TS sabe que es string
      rol: UserRole.WORKER,
      isVerified: true,
      isActive: true,
      // No pases horarioId: null aquí, si es opcional, simplemente no lo incluyas
    });
    
    const savedAllowed = await queryRunner.manager.save(newAllowedUser);

    // Crear el registro en User
    const tempPassword = bcrypt.hashSync(dto.dni.toUpperCase().trim(), 10);

    const newUser = queryRunner.manager.create(User, {
      email: dto.email,
      password: tempPassword,
      nombre: dto.nombre,
      dni: dto.dni.toUpperCase().trim(),
      telefono: dto.telefono,
      rol: UserRole.WORKER,
      empresaId: empresaIdValido,
      isActive: true,
      isVerified: true,
    });
    
    await queryRunner.manager.save(newUser);

    await queryRunner.commitTransaction();

    return {
      message: 'Trabajador creado y habilitado',
      worker: savedAllowed,
      credentials: {
        email: dto.email,
        tempPassword: dto.dni.toUpperCase().trim()
      }
    };

  } catch (error) {
    await queryRunner.rollbackTransaction();
    // Manejo de errores...
    throw error;
  } finally {
    await queryRunner.release();
  }
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