import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'auth/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from 'auth/roles.enum';
import { AllowedPhonesService } from 'allowed-phones/allowed-phones.service';
import { CreateAdminDto } from './dto/create-admin.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly allowedPhonesService: AllowedPhonesService, // para control de teléfonos
  ) {}

  // ========================
  // CREAR USUARIO (REGISTRO)
  // ========================
  async create(createUserDto: CreateUserDto) {
    // Validar allowed phones
    const allowed = await this.allowedPhonesService.checkPhoneAllowed(
      createUserDto.telefono,
    );
    if (!allowed) {
      throw new Error('Número no autorizado para registrarse');
    }

    const user = this.userRepository.create({
      ...createUserDto,
      rol: [UserRole.USER],
      isVerified: true,
    });

    await this.userRepository.save(user);

    // Marcar teléfono como usado
    await this.allowedPhonesService.markUsed(createUserDto.telefono);

    return user;
  }

  // ========================
  // LISTAR USUARIOS
  // Solo admin
  // ========================
  findAll() {
    return this.userRepository.find();
  }

  // ========================
  // OBTENER USUARIO POR ID
  // ========================
  async findOne(id: string) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  // ========================
  // ACTUALIZAR USUARIO
  // ========================
  async update(id: string, dto: UpdateUserDto) {
    const user = await this.userRepository.preload({
      id,
      ...dto,
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.userRepository.save(user);
  }

  // ========================
  // ELIMINAR USUARIO
  // ========================
  async remove(id: string) {
    const result = await this.userRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return { message: 'Usuario eliminado' };
  }

  // ========================
  // CAMBIAR ROL (solo admin)
  // ========================
  async updateRole(id: string, roles: UserRole[]) {
    const user = await this.findOne(id);

    user.rol = roles;

    return this.userRepository.save(user);
  }

  async createAdmin(dto: CreateAdminDto) {
    // Crear usuario
    const user = this.userRepository.create({
      ...dto,
      rol: [UserRole.ADMIN],
      isVerified: true,
    });

    return this.userRepository.save(user);
  }

}
