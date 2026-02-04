// src/allowed-user/allowed-user.service.ts
import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AllowedUser } from './entities/allowed-user.entity';
import { CreateWorkerDto } from './dto/worker.dto';
import { User } from 'auth/entities/user.entity';
import { UserRole } from 'auth/roles.enum';
import * as bcrypt from 'bcrypt';
import { Horario } from 'schedule/entities/schedules.entity';

@Injectable()
export class WorkerService {
  constructor(
    @InjectRepository(AllowedUser)
    private readonly allowedUserRepository: Repository<AllowedUser>,
    
  private readonly dataSource: DataSource,
  ) {}

async create(dto: CreateWorkerDto, admin: User) {
  // 1. Validación: El administrador debe tener empresa
  if (!admin.empresaId) {
    throw new BadRequestException('El administrador debe tener una empresa asignada');
  }

  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const empresaIdValido: number = admin.empresaId;

    // 2. Encriptar la contraseña que el administrador escribió
    const hashedPassword = bcrypt.hashSync(dto.password, 10);

    // 3. Crear el registro en AllowedUser (Pre-autorización)
    const newAllowedUser = queryRunner.manager.create(AllowedUser, {
      
      nombre: dto.nombre,
      email: dto.email?.toLowerCase().trim() || '',
      telefono: dto.telefono,
      password: hashedPassword,
      dni: dto.dni?.toUpperCase().trim() || 'PENDIENTE',      empresaId: empresaIdValido,
      apellidos: dto.apellidos || '',
      fechaNacimiento: dto.fechaNacimiento,
      calle: dto.calle,
      poblacion: dto.poblacion,
      provincia:  dto.provincia,
      pais: dto.pais,
      categoria: dto.categoria,
      actividad: dto.actividad,
      diaPertenece: dto.diaPertenece,
      rol: UserRole.WORKER,
      isVerified: true, // Se marca como verificado porque el admin lo creó directamente
      isActive: true,
    });
    
    const savedAllowed = await queryRunner.manager.save(newAllowedUser);

    // 4. Crear el registro en la tabla User para que pueda hacer Login
    const newUser = queryRunner.manager.create(User, {
      email: dto.email?.toLowerCase().trim() || '',      password: hashedPassword, // Guardamos la versión encriptada
      nombre: dto.nombre,
      dni: dto.dni?.toUpperCase().trim() || 'PENDIENTE',      telefono: dto.telefono,
      rol: UserRole.WORKER,
      empresaId: empresaIdValido,
      isActive: true,
      isVerified: true,
    });
    
    await queryRunner.manager.save(newUser);

    // 5. Confirmar la transacción en la base de datos
    await queryRunner.commitTransaction();

    return {
      message: 'Trabajador creado y habilitado correctamente',
      worker: {
        id: savedAllowed.id,
        nombre: savedAllowed.nombre,
        email: savedAllowed.email,
        // Por seguridad, NO devolvemos la contraseña en la respuesta
      }
    };

  } catch (error) {
    // Si algo falla (ej: email duplicado), deshacemos los cambios
    await queryRunner.rollbackTransaction();
    
    if (error.code === '23505') {
      throw new BadRequestException('El correo electrónico o DNI ya está registrado');
    }
    
    throw error;
  } finally {
    // Liberar la conexión del queryRunner
    await queryRunner.release();
  }
}

  // Listar solo los permitidos de la empresa del Admin logueado
  async findAllByEmpresa(empresaId: number) {
    if (!empresaId) return []; // Los SuperAdmin podrían no tener empresaId
    
    return await this.allowedUserRepository.find({
      where: { empresaId },
      order: { createdAt: 'DESC' }
    });
  }
  
  async findOne(id: number): Promise<AllowedUser> {
    const user = await this.allowedUserRepository.findOneBy({ id });
    
    if (!user) {
      throw new NotFoundException(`El registro con ID ${id} no existe`);
    }
    
    return user;
  }

  async update(id: number, updateDto: any) {
    // Si se actualiza el email o dni, normalizarlos
    if (updateDto.email) updateDto.email = updateDto.email.toLowerCase().trim();
    if (updateDto.dni) updateDto.dni = updateDto.dni.toUpperCase().trim();

    await this.allowedUserRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    return await this.allowedUserRepository.remove(user);
  }

async findAll() {
  return await this.allowedUserRepository.find({
    order: { createdAt: 'DESC' }
  });
}

async assignSchedule(
  allowedUserId: number, 
  horarioId: number, 
  empresaId: number | null 
) {
  // 1. Buscar el registro en AllowedUser
  const allowedUser = await this.allowedUserRepository.findOne({
    where: { 
      id: allowedUserId, 
      ...(empresaId && { empresaId: empresaId }) 
    }
  });

  if (!allowedUser) {
    throw new NotFoundException('Trabajador no encontrado en su empresa');
  }

  // 2. Buscar el usuario correspondiente en la tabla User (Login) por email
  const userRepository = this.dataSource.getRepository(User);
  const user = await userRepository.findOneBy({ email: allowedUser.email });

  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Creamos el objeto de relación para que TypeORM lo procese
    const horarioRelacion = { id: horarioId } as Horario;

    // Asignamos a la propiedad 'horario' de tus entidades
    allowedUser.horario = horarioRelacion; 
    if (user) {
      user.horario = horarioRelacion;
    }

    await queryRunner.manager.save(allowedUser);
    if (user) {
      await queryRunner.manager.save(user);
    }
    
    await queryRunner.commitTransaction();
    
    return { 
      message: 'Horario asignado y sincronizado correctamente', 
      horarioId 
    };
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw new InternalServerErrorException('Error al sincronizar el horario en las tablas');
  } finally {
    await queryRunner.release();
  }
}
}