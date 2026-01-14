import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "auth/entities/user.entity";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { UserRole } from "auth/roles.enum";
import { Empresa } from "empresas/entities/empresa.entity";
import { CreateWorkerDto } from "./dto/create-worker.dto";

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

    return this.userRepository.save(user);
  }

  // ========================
  // CREAR WORKER (ADMIN)
  // ========================
 async createWorker(dto: CreateWorkerDto, empresa: Empresa) {
  const { codigoOTP, ...userData } = dto;

  const expiraEn = new Date();
  expiraEn.setMinutes(expiraEn.getMinutes() + 5); // Expira en 5 minutos
  const user = this.userRepository.create({
    ...userData, 
    rol: UserRole.WORKER,
    empresa,
    codigoOTP,
    codigoExpiraEn: expiraEn,
    isVerified: false,
    isActive: true,
  });

  return this.userRepository.save(user);
  }

  // ========================
  // LISTAR USUARIOS POR SCOPE
  // ========================
  async findAllByUser(user: User) {
    // El SUPERADMIN ve absolutamente todo
    if (user.rol === UserRole.SUPERADMIN) {
      return this.userRepository.find({
        relations: ['empresa'], // 'rol' no es una relación, es un enum
      });
    }
    
// El ADMIN ve solo a los usuarios de SU empresa
    if (!user.empresa) {
        throw new ForbiddenException('El administrador no tiene una empresa asignada');
    }

    return this.userRepository.find({
      where: { empresa: { id: user.empresa.id } },
      relations: ['empresa'],
    });
  }

  // ========================
  // OBTENER USUARIO POR ID
  // ========================
  async findOneById(id: string, currentUser: User) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['empresa'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // ADMIN no puede ver usuarios de otra empresa
   // Validación de Scope: Si no es SUPERADMIN, debe pertenecer a la misma empresa
    if (currentUser.rol !== UserRole.SUPERADMIN) {
      if (!currentUser.empresa || currentUser.empresa.id !== user.empresa?.id) {
        throw new ForbiddenException('No tienes permiso para ver este usuario');
      }
    }
    
    return user;
  }

  // ========================
  // ACTUALIZAR USUARIO
  // ========================
  async update(id: string, dto: UpdateUserDto, currentUser: User) {
    const user = await this.findOneById(id, currentUser);

    Object.assign(user, dto);

    return this.userRepository.save(user);
  }

  // ========================
  // ELIMINAR (SOFT DELETE)
  // ========================
  async remove(id: string, currentUser: User) {
    const user = await this.findOneById(id, currentUser);
    
    user.isActive = false;

    return this.userRepository.save(user);
  }

  async findAllRaw() {
    return this.userRepository.find({ relations: ['empresa'] });
  }
}