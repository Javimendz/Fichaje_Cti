// src/allowed-user/allowed-user.service.ts
import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, DeepPartial } from 'typeorm';
import { CreateWorkerDto } from './dto/worker.dto';
import { User } from 'auth/entities/user.entity';
import { UserRole } from 'auth/roles.enum';
import * as bcrypt from 'bcrypt';
import { Horario } from 'schedule/entities/schedules.entity';
import { Worker } from './entities/worker.entity';

@Injectable()
export class WorkerService {
  constructor(
    @InjectRepository(Worker)
    private readonly allowedUserRepository: Repository<Worker>,
    
  private readonly dataSource: DataSource,
  ) {}


/*
async create(dto: CreateWorkerDto, admin: User) {
  if (!admin.empresaId) {
    throw new BadRequestException('El administrador debe tener una empresa asignada');
  }

  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const empresaIdValido: number = admin.empresaId;
    const hashedPassword = bcrypt.hashSync(dto.password, 10);

    const cleanEmail = dto.email ? dto.email.toLowerCase().trim() : null;
    const cleanDni = dto.dni ? dto.dni.toUpperCase().trim() : null;

    // 1. Instanciar User (La entidad para el Login)
    const newUser = queryRunner.manager.create(User, {
      email: cleanEmail,
      password: hashedPassword,
      nombre: dto.nombre,
      dni: cleanDni,
      telefono: dto.telefono,
      rol: UserRole.WORKER,
      empresaId: empresaIdValido,
      isActive: true,
      isVerified: true,
    });

    // 2. Instanciar Worker (La entidad con datos de empleado)
    const workerData: Partial<Worker> = {
      nombre: dto.nombre,
      email: cleanEmail,
      telefono: dto.telefono,
      password: hashedPassword,
      dni: cleanDni,
      empresaId: empresaIdValido,
      apellidos: dto.apellidos || '',
      fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : null,
      calle: dto.calle,
      poblacion: dto.poblacion,
      provincia: dto.provincia,
      pais: dto.pais,
      categoria: dto.categoria,
      actividad: dto.actividad,
      diaPertenece: dto.diaPertenece,
      rol: UserRole.WORKER,
      isVerified: true,
      isActive: true,
    };
    const newWorker = queryRunner.manager.create(Worker, workerData);

    // 3. GUARDADO SECUENCIAL (Para evitar confusión de IDs)
    // Guardamos el usuario primero
    await queryRunner.manager.save(newUser);
    
    // Guardamos el worker y capturamos SU instancia guardada específicamente
    const savedWorker = await queryRunner.manager.save(newWorker);

    await queryRunner.commitTransaction();

    // Ahora savedWorker.id es, sin duda, el de la tabla 'worker'
    return {
      message: 'Trabajador creado y habilitado correctamente',
      worker: {
        id: savedWorker.id, // ID real de la tabla workers
        nombre: savedWorker.nombre,
        email: savedWorker.email,
      }
    };

  } catch (error) {
    await queryRunner.rollbackTransaction();
    if (error.code === '23505') {
      throw new BadRequestException('El correo electrónico, teléfono o DNI ya está registrado por otro usuario');
    }
    throw error;
  } finally {
    await queryRunner.release();
  }
}
*/

async create(dto: CreateWorkerDto, admin: User) {
    // 1. Validación de seguridad básica
    if (!admin.empresaId) {
      throw new BadRequestException('El administrador debe tener una empresa asignada');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const empresaIdValido = admin.empresaId;
      const hashedPassword = bcrypt.hashSync(dto.password, 10);
      const cleanEmail = dto.email ? dto.email.toLowerCase().trim() : null;
      const cleanDni = dto.dni ? dto.dni.toUpperCase().trim() : null;

      // 2. Crear y Guardar el USUARIO (Él genera el ID base)
      const userData: DeepPartial<User> = {
        email: cleanEmail,
        password: hashedPassword,
        nombre: dto.nombre,
        dni: cleanDni,
        telefono: dto.telefono,
        rol: UserRole.WORKER,
        empresaId: empresaIdValido,
        isActive: true,
        isVerified: true,
      };

      const newUser = queryRunner.manager.create(User, userData);
      const savedUser = await queryRunner.manager.save(User, newUser);

      // 3. Crear el WORKER usando el mismo ID del Usuario
      // Usamos DeepPartial<Worker> para evitar el error de sobrecarga sin usar 'any'
      const workerData: DeepPartial<Worker> = {
        id: savedUser.id, // <--- SINCRONIZACIÓN DE IDS
        nombre: dto.nombre,
        apellidos: dto.apellidos || '',
        email: cleanEmail,
        telefono: dto.telefono,
        password: hashedPassword,
        dni: cleanDni,
        empresaId: empresaIdValido,
        fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : null,
        calle: dto.calle,
        poblacion: dto.poblacion,
        provincia: dto.provincia,
        pais: dto.pais,
        categoria: dto.categoria,
        actividad: dto.actividad,
        diaPertenece: dto.diaPertenece,
        rol: UserRole.WORKER,
        isVerified: true,
        isActive: true,
      };

      const newWorker = queryRunner.manager.create(Worker, workerData);
      const savedWorker = await queryRunner.manager.save(Worker, newWorker);

      // 4. Confirmar cambios
      await queryRunner.commitTransaction();

      return {
        message: 'Trabajador y Usuario creados con ID compartido',
        id: savedWorker.id,
        email: savedWorker.email,
      };

    } catch (error) {
      // Si algo falla, se deshace todo (no queda el User sin el Worker)
      await queryRunner.rollbackTransaction();

      if (error.code === '23505') {
        throw new BadRequestException('El DNI, Email o Teléfono ya existe en el sistema');
      }

      throw new InternalServerErrorException('Error al crear el trabajador: ' + error.message);
    } finally {
      // Liberar el queryRunner
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
  
  async findOne(id: number): Promise<Worker> {
    const user = await this.allowedUserRepository.findOneBy({ id });
    
    if (!user) {
      throw new NotFoundException(`El registro con ID ${id} no existe`);
    }
    
    return user;
  }

async update(id: number, updateDto: any) {
    if (updateDto.email) {
      updateDto.email = updateDto.email.toLowerCase().trim();
    } else if (updateDto.email === "") {
      updateDto.email = null;
    }

    if (updateDto.dni) {
      updateDto.dni = updateDto.dni.toUpperCase().trim();
    } else if (updateDto.dni === "") {
      updateDto.dni = null;
    }

    try {
      await this.allowedUserRepository.update(id, updateDto);
      return this.findOne(id);
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('No se puede actualizar: El DNI o Email ya existe en otro registro');
      }
      throw error;
    }
  }
  
async findAll() {
  return await this.allowedUserRepository.find({
    order: { createdAt: 'DESC' }
  });
}
async remove(id: number) {
  // 1. Buscamos el trabajador primero para asegurar que existe y lanzar 404 si no
  await this.findOne(id);

  try {
    // 2. Borramos al PADRE (User). 
    // Al borrar al usuario, la base de datos ELIMINARÁ el Worker automáticamente.
    const result = await this.dataSource.getRepository(User).delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`No se pudo eliminar el usuario con ID ${id}`);
    }

    return { 
      message: `Trabajador y credenciales eliminados correctamente (ID: ${id})` 
    };
  } catch (error) {
    throw new InternalServerErrorException('Error al eliminar el registro: ' + error.message);
  }
}
  async assignSchedule(workerId: number, horarioId: number, empresaId: number | null) {
    const worker = await this.allowedUserRepository.findOne({
      where: { id: workerId, ...(empresaId && { empresaId }) }
    });

    if (!worker) throw new NotFoundException('Trabajador no encontrado');

    const user = worker.email 
      ? await this.dataSource.getRepository(User).findOneBy({ email: worker.email })
      : null;

    try {
      return await this.dataSource.transaction(async (manager) => {
        const horario = { id: horarioId } as Horario;
        worker.horario = horario;
        if (user) user.horario = horario;

        await manager.save([worker, user].filter(Boolean));

        return { message: 'Horario asignado correctamente', horarioId };
      });
    } catch (error) {
      throw new InternalServerErrorException('Error al sincronizar el horario');
    }
  }
}