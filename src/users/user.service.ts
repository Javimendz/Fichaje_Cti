import { 
  BadRequestException, 
  ForbiddenException, 
  Injectable, 
  InternalServerErrorException, 
  NotFoundException 
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { CreateWorkerDto } from "./dto/create-worker.dto";
import { UserRole } from "auth/roles.enum";
import type { UserPayload } from "auth/interfaces/user-payload.interface"; 
import { User } from "./entities/user.entity";
import * as bcrypt from 'bcrypt';

type CreateUserDto = CreateAdminDto | CreateWorkerDto;

@Injectable()
export class UserService {
  
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ========================
  // MÉTODO ÚNICO DE CREACIÓN
  // ========================
 async create(dto: CreateUserDto, currentUser: UserPayload) {
  let empresaIdFinal: number;

  // 1. Lógica de Empresa (SuperAdmin vs Admin)
  if (currentUser.rol === UserRole.SUPERADMIN) {
    if (!dto.empresaId) throw new BadRequestException('Debe especificar empresaId');
    empresaIdFinal = Number(dto.empresaId);
  } else {
    if (!currentUser.empresaId) throw new ForbiddenException('No tienes empresa asociada');
    empresaIdFinal = currentUser.empresaId;
  }

  // 2. Rol solicitado (Limpieza de array si viene como ["ADMIN"])
  const rolSolicitado = Array.isArray(dto.rol) ? dto.rol[0] : (dto.rol || UserRole.WORKER);

  if (rolSolicitado === UserRole.SUPERADMIN && currentUser.rol !== UserRole.SUPERADMIN) {
    throw new ForbiddenException('No puedes crear un SuperAdmin');
  }

  // 3. Hashing de Contraseña (VITAL para que la DB no reciba nulos o basura)
  const passwordHash = dto.password 
    ? await bcrypt.hash(dto.password, 10) 
    : await bcrypt.hash('Temporal123!', 10); // Contraseña por defecto si no viene

  // 4. Crear objeto compatible con la Entidad
 const newUser = this.userRepository.create({
  ...dto,            // Campos generales (nombre, email, etc.)
  password: passwordHash,
  rol: rolSolicitado as UserRole,
  empresaId: empresaIdFinal, // Esto pisa cualquier empresaId que viniera en el spread del dto
  isActive: true,
  isVerified: true,
});

  try {
    return await this.userRepository.save(newUser);
  } catch (error) {
    console.error("ERROR DB:", error);
    if (error.code === '23505') throw new BadRequestException('DNI, Email o Teléfono duplicado');
    throw new InternalServerErrorException('Error al guardar: ' + error.message);
  }
}
  // ========================
  // LISTAR USUARIOS POR SCOPE
  // ========================
  async findAllByUser(currentUser: UserPayload) {
    if (currentUser.rol === UserRole.SUPERADMIN) {
      return await this.userRepository.find({ relations: ['empresa'] });
    }
    
    if (!currentUser.empresaId) {
      throw new ForbiddenException('El administrador no tiene una empresa asignada');
    }

    return await this.userRepository.find({
      where: { empresaId: currentUser.empresaId },
      relations: ['empresa'],
    });
  }

  // ========================
  // OBTENER USUARIO POR ID
  // ========================
  async findOneById(id: number, currentUser: UserPayload) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['empresa'],
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (currentUser.rol !== UserRole.SUPERADMIN) {
      if (user.empresaId !== currentUser.empresaId) {
        throw new ForbiddenException('No tienes permiso para acceder a este usuario');
      }
    }
    
    return user;
  }

  // ========================
  // ACTUALIZAR USUARIO
  // ========================
 async update(id: number, dto: UpdateUserDto, currentUser: UserPayload) {
  const user = await this.findOneById(id, currentUser);

  // 1. Protección de Rol
  if (dto.rol && currentUser.rol !== UserRole.SUPERADMIN) {
    delete dto.rol;
  }

  // 2. Hashing de contraseña si viene en el update
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

  Object.assign(user, dto);
  return await this.userRepository.save(user);
}
  // ========================
  // ELIMINAR (SOFT DELETE)
  // ========================
  async remove(id: number, currentUser: UserPayload) {
    const user = await this.findOneById(id, currentUser);
    
    if (user.id === currentUser.userId) {
        throw new ForbiddenException('No puedes eliminar tu propia cuenta');
    }

    user.isActive = false;
    return await this.userRepository.save(user);
  }
}