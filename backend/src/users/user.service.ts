import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, DeepPartial, Repository } from "typeorm";
import * as bcrypt from "bcrypt";

import { UpdateUserDto } from "./dto/update-user.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { UserRole } from "../auth/roles.enum";
import type { UserPayload } from "../auth/interfaces/user-payload.interface";
import { User } from "../auth/entities/user.entity";
import { Worker } from "../worker/entities/worker.entity";
import { Activity } from "../activity/entities/activity.entity";
import { WorkerService } from "../worker/worker.service";


@Injectable()
export class UserService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Worker)
    private readonly workerRepository: Repository<Worker>,
    private readonly workerService: WorkerService
  ) { }

  // ========================
  // CREAR USUARIO (TRANSACCIONAL)
  // ========================
  async create(dto: CreateUserDto, currentUser: UserPayload) {
    return this.dataSource.transaction(async (manager) => {

      // ✅ TIPADO EXPLÍCITO
      const userRepo: Repository<User> = manager.getRepository(User);
      const workerRepo: Repository<Worker> = manager.getRepository(Worker);

      let empresaIdFinal: number;

      if (currentUser.rol === UserRole.SUPERADMIN) {
        if (!dto.empresaId) {
          throw new BadRequestException("Debe especificar empresaId");
        }
        empresaIdFinal = dto.empresaId;
      } else {
        if (!currentUser.empresaId) {
          throw new ForbiddenException("No tienes empresa asociada");
        }
        empresaIdFinal = currentUser.empresaId;
      }

      const rolExtraido = Array.isArray(dto.rol) ? dto.rol[0] : dto.rol;
      const rolSolicitado = (rolExtraido || UserRole.WORKER) as UserRole;

      if (rolSolicitado === UserRole.SUPERADMIN) {
        throw new ForbiddenException("No se puede crear SUPERADMIN");
      }

      if (
        currentUser.rol === UserRole.SUPERADMIN &&
        rolSolicitado !== UserRole.ADMIN
      ) {
        throw new ForbiddenException("SuperAdmin solo puede crear ADMIN");
      }

      if (
        currentUser.rol === UserRole.ADMIN &&
        rolSolicitado !== UserRole.WORKER
      ) {
        throw new ForbiddenException("Admin solo puede crear WORKER");
      }

      // 🔹 Validación duplicados
      const existing = await userRepo.findOne({
        where: [
          { email: dto.email },
          { dni: dto.dni },
          { telefono: dto.telefono },
        ],
      });

      if (existing) {
        throw new BadRequestException(
          "Email, DNI o teléfono ya registrados"
        );
      }

      const passwordHash = await bcrypt.hash(
        dto.password || "Temporal123!",
        12
      );

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      console.log('DEBUG actividadId:', {
  dtoActividadId: dto.actividadId,
  type: typeof dto.actividadId,
});

      // ✅ IMPORTANTE: usar userRepo, NO this.userRepository
      const newUser: User = userRepo.create({
        email: dto.email ,
        nombre: dto.nombre ,
        apellidos: dto.apellidos ,
        dni: dto.dni ?? undefined,
        telefono: dto.telefono!,              // <- obligatorio, nunca null
        password: passwordHash,
        rol: rolSolicitado,
        empresaId: empresaIdFinal,
        horarioId: dto.horarioId ,
         actividadId: dto.actividadId ?? undefined,   // ✅ columna física explícita
        actividad: dto.actividadId ? { id: dto.actividadId } as Activity : undefined,
        isActive: true,
        isVerified: true,
        fechaInicioHorario: dto.horarioId ? hoy : null,
      });

      console.log('DEBUG ANTES DE GUARDAR:', {
  nombre: newUser.nombre,
  apellidos: newUser.apellidos,
  email: newUser.email,
});

      const savedUser: User = await userRepo.save(newUser);

      // 🔹 Crear Worker
      if (rolSolicitado === UserRole.WORKER) {
        const newWorker = workerRepo.create({
          id: savedUser.id,
          empresaId: empresaIdFinal,
          horarioId: dto.horarioId ?? undefined,
          nombre: savedUser.nombre!,
          fechaInicioHorario: savedUser.fechaInicioHorario,
          apellidos: savedUser.apellidos!,
          telefono: savedUser.telefono!,
          dni: savedUser.dni!,
          email: savedUser.email!,
          actividadId: dto.actividadId, 
          actividad: dto.actividadId ? { id: dto.actividadId } : null,
          isActive: true,
          rol: UserRole.WORKER,
        } as DeepPartial<Worker>);

        await workerRepo.save(newWorker);
      }

      return savedUser;
    });
  }


  // ========================
  // LISTAR
  // ========================
  async findAllByUser(currentUser: UserPayload) {
    if (currentUser.rol === UserRole.SUPERADMIN) {
      return this.userRepository.find({
        where: { rol: UserRole.ADMIN },
        relations: ["empresa"],
        order: { createdAt: "DESC" },
      });
    }

    return this.userRepository.find({
      where: {
        empresaId: currentUser.empresaId,
        rol: UserRole.WORKER,
      },
      relations: ["empresa", "horario", "actividad"],
      order: { nombre: "ASC" },
    });
  }

  // ========================
  // OBTENER POR ID
  // ========================
  async findOneById(id: number, currentUser: UserPayload) {
    if (!id || id <= 0) {
      throw new BadRequestException("ID inválido");
    }

    const user = await this.userRepository.findOne({
      where: { id },
      relations: ["empresa", "horario", "actividad"],
    });

    if (!user) {
      throw new NotFoundException("Usuario no encontrado");
    }

    if (
      currentUser.rol !== UserRole.SUPERADMIN &&
      user.empresaId !== currentUser.empresaId
    ) {
      throw new ForbiddenException("Sin permisos");
    }

    return user;
  }

  // ========================
  // ACTUALIZAR (TRANSACCIONAL)
  // ========================
 // src/users/user.service.ts

async update(id: number, dto: UpdateUserDto, currentUser: UserPayload) {
  return await this.dataSource.transaction(async (manager) => {
    const userRepo: Repository<User> = manager.getRepository(User);
    const workerRepo: Repository<Worker> = manager.getRepository(Worker);

    // 1. Buscamos el usuario actual con sus relaciones
    const user = await userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException("Usuario no encontrado");

    // 2. Validación de permisos (Multi-tenancy)
    if (
      currentUser.rol !== UserRole.SUPERADMIN &&
      user.empresaId !== currentUser.empresaId
    ) {
      throw new ForbiddenException("No tienes permisos para editar este usuario");
    }

    const oldRole = user.rol;

    // 3. LÓGICA CRUCIAL: Gestión de la Fecha de Inicio de Horario
    // Si el horario cambia, reseteamos la fecha ancla para que la rotación empiece de nuevo.
   if (dto.horarioId !== undefined && dto.horarioId !== user.horarioId) {
  if (dto.horarioId === null) {
    // Si es trabajador, no permitimos fecha nula si queremos que aparezca en el front
    user.fechaInicioHorario = (user.rol === UserRole.WORKER) ? new Date() : null;
    if (user.fechaInicioHorario) user.fechaInicioHorario.setHours(0, 0, 0, 0);
  } else {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    user.fechaInicioHorario = hoy;
  }
}
    if (user.rol === UserRole.WORKER && user.horarioId && !user.fechaInicioHorario) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  user.fechaInicioHorario = hoy;
}

    // 4. Gestión de Password (si viene en el DTO)
    if (dto.password && dto.password.trim().length > 0) {
      user.password = await bcrypt.hash(dto.password, 12);
    }

    // 5. Gestión de cambio de ROL (Solo SuperAdmin)
    if (dto.rol !== undefined) {
      if (currentUser.rol !== UserRole.SUPERADMIN) {
        throw new ForbiddenException("Solo un SuperAdmin puede cambiar el rol de un usuario");
      }
      const rolExtraido = Array.isArray(dto.rol) ? dto.rol[0] : dto.rol;
      user.rol = rolExtraido as UserRole;
    }

    // 6. Actualización de campos básicos (Evitando nulos accidentales)
    user.nombre = dto.nombre ?? user.nombre;
    user.apellidos = dto.apellidos ?? user.apellidos;
    user.email = dto.email ? dto.email.toLowerCase().trim() : user.email;
    user.telefono = dto.telefono ?? user.telefono;
    user.dni = dto.dni ?? user.dni;
    user.horarioId = dto.horarioId !== undefined ? dto.horarioId : user.horarioId;
    user.actividadId = dto.actividadId !== undefined ? dto.actividadId : user.actividadId;
    user.isActive = dto.isActive !== undefined ? dto.isActive : user.isActive;

    // Guardamos el usuario (Tabla Auth)
    const updatedUser = await userRepo.save(user);

    // 7. SINCRONIZACIÓN CON LA TABLA WORKER
    if (updatedUser.rol === UserRole.WORKER) {
      let worker = await workerRepo.findOne({ where: { id: updatedUser.id } });

      // Si no existía en la tabla workers (porque antes era Admin), lo creamos
      if (!worker) {
        worker = workerRepo.create({
          id: updatedUser.id,
          empresaId: updatedUser.empresaId,
        });
      }

      // Sincronizamos todos los datos, incluyendo la FECHA DE INICIO
      Object.assign(worker, {
        nombre: updatedUser.nombre,
        apellidos: updatedUser.apellidos,
        email: updatedUser.email,
        telefono: updatedUser.telefono,
        dni: updatedUser.dni,
        horarioId: updatedUser.horarioId,
        fechaInicioHorario: updatedUser.fechaInicioHorario, // 👈 AQUÍ ESTABA EL ERROR
        actividadId: updatedUser.actividadId,
        isActive: updatedUser.isActive,
        rol: UserRole.WORKER,
      });

      await workerRepo.save(worker);

    } else if (oldRole === UserRole.WORKER) {
      // TypeScript ya sabe aquí que updatedUser.rol !== UserRole.WORKER
      await workerRepo.delete(id);
      console.log(`[Audit] Perfil de Worker eliminado para el ID ${id} por cambio de rol.`);
    }

    return updatedUser;
  });
}
  // ========================
  // SOFT DELETE
  // ========================
  async remove(id: number, currentUser: UserPayload) {
    return await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const workerRepo = manager.getRepository(Worker);

      const user = await userRepo.findOne({ where: { id } });
      if (!user) throw new NotFoundException("Usuario no encontrado");

      if (user.id === currentUser.id) {
        throw new ForbiddenException(
          "No puedes eliminar tu propia cuenta"
        );
      }

      user.isActive = false;
      const deletedUser = await userRepo.save(user);

      if (user.rol === UserRole.WORKER) {
        const worker = await workerRepo.findOne({ where: { id } });
        if (worker) {
          worker.isActive = false;
          await workerRepo.save(worker);
        }
      }

      return deletedUser;
    });
  }



  // Sobrescribimos el límite global: 
  // Solo 3 peticiones (limit) cada 900 segundos (ttl = 15 minutos)
  
}