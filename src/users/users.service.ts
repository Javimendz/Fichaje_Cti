import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "auth/entities/user.entity";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { UserRole } from "auth/roles.enum";
import { Empresa } from "empresas/entities/empresa.entity";
import { CreateWorkerDto } from "./dto/create-worker.dto";
// ✅ Importamos el Payload en lugar de la Entidad para el usuario que ejecuta la acción
import type { UserPayload } from "auth/interfaces/user-payload.interface"; 

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ========================
  // CREAR ADMIN (SUPERADMIN)
  // ========================
  async createAdmin(dto: CreateAdminDto, empresa: Empresa) {
    const user = this.userRepository.create({
      ...dto,
      rol: UserRole.ADMIN,
      empresa: empresa,
      isVerified: true,
      isActive: true,
    });

    return await this.userRepository.save(user);
  }

  // ========================
  // CREAR WORKER (ADMIN)
  // ========================
  async createWorker(dto: CreateWorkerDto, empresa: Empresa) {
    const expiraEn = new Date();
    expiraEn.setMinutes(expiraEn.getMinutes() + 5);

    const user = this.userRepository.create({
      ...dto, // dni, nombre, telefono vienen aquí
      rol: UserRole.WORKER,
      empresa,
      isVerified: false,
      isActive: true,
    });

    return await this.userRepository.save(user);
  }

  // ========================
  // LISTAR USUARIOS POR SCOPE
  // ========================
  async findAllByUser(currentUser: UserPayload) {
    // 1. SUPERADMIN ve todo
    if (currentUser.rol === UserRole.SUPERADMIN) {
      return await this.userRepository.find({
        relations: ['empresa'],
      });
    }
    
    // 2. ADMIN ve solo su empresa
    if (!currentUser.empresaId) {
        throw new ForbiddenException('El administrador no tiene una empresa asignada');
    }

    return await this.userRepository.find({
      where: { empresa: { id: currentUser.empresaId } },
      relations: ['empresa'],
    });
  }

  // ========================
  // OBTENER USUARIO POR ID
  // ========================
  async findOneById(id: string, currentUser: UserPayload) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['empresa'],
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Validación de Scope usando el Payload
    if (currentUser.rol !== UserRole.SUPERADMIN) {
      if (user.empresa?.id !== currentUser.empresaId) {
        throw new ForbiddenException('No tienes permiso para acceder a este usuario');
      }
    }
    
    return user;
  }

  // ========================
  // ACTUALIZAR USUARIO
  // ========================
  async update(id: string, dto: UpdateUserDto, currentUser: UserPayload) {
    const user = await this.findOneById(id, currentUser);

    // Protección extra: Un Admin no puede promoverse a Superadmin
    if (dto.rol && currentUser.rol !== UserRole.SUPERADMIN) {
        delete dto.rol; 
    }

    Object.assign(user, dto);
    return await this.userRepository.save(user);
  }

  // ========================
  // ELIMINAR (SOFT DELETE)
  // ========================
  async remove(id: string, currentUser: UserPayload) {
    const user = await this.findOneById(id, currentUser);
    
    // Evitar que el Admin se borre a sí mismo accidentalmente
    if (user.id === currentUser.userId) {
        throw new ForbiddenException('No puedes eliminar tu propia cuenta');
    }

    user.isActive = false;
    return await this.userRepository.save(user);
  }
}