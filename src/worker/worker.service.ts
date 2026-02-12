import { 
  Injectable, 
  BadRequestException, 
  InternalServerErrorException, 
  NotFoundException, 
  ForbiddenException, 
  UnauthorizedException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, DeepPartial, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';

// Entidades
import { Worker } from './entities/worker.entity';
import { User } from '../auth/entities/user.entity'; // Ajusta la ruta a tu entidad User

// DTOs e Interfaces
import { CreateWorkerDto } from './dto/worker.dto'; // Ajusta la ruta si es necesario
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { UserRole } from '../auth/roles.enum';
import type { UserPayload } from '../auth/interfaces/user-payload.interface'; // 👈 CLAVE: import type
import { Horario } from 'schedule/entities/schedules.entity';

@Injectable()
export class WorkerService {
  constructor(
    @InjectRepository(Worker)
    private readonly workerRepository: Repository<Worker>,
    private readonly dataSource: DataSource, // Necesario para transacciones
  ) {}

  /**
   * Crea un Usuario (Login) y un Worker (Datos) en una sola transacción.
   * Soluciona el problema de tipado usando 'UserPayload'.
   */
  async create(dto: CreateWorkerDto, admin: UserPayload) { // ✅ Corregido: recibe UserPayload
    
    // 1. Verificación de seguridad (Multi-tenancy)
    if (!admin.empresaId) {
      throw new BadRequestException('El administrador no tiene empresa asignada');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const empresaId = admin.empresaId;
      const hashedPassword = bcrypt.hashSync(dto.password, 10);
      
      // Normalización de datos
      const cleanEmail = dto.email ? dto.email.toLowerCase().trim() : null;
      const cleanDni = dto.dni ? dto.dni.toUpperCase().trim() : null;

      // 2. Crear instancia de USUARIO (Auth)
      // Esto es necesario para generar el ID y tener credenciales de acceso
      const newUser = queryRunner.manager.create(User, {
        email: cleanEmail,
        password: hashedPassword,
        nombre: dto.nombre,
        dni: cleanDni,
        telefono: dto.telefono,
        rol: UserRole.WORKER,
        empresaId: empresaId,
        isActive: true,
        isVerified: true,
      } as DeepPartial<User>);

      const savedUser = await queryRunner.manager.save(User, newUser);

      // 3. Crear instancia de WORKER (Perfil)
      // ⚠️ IMPORTANTE: Usamos el ID del usuario guardado (savedUser.id)
      const newWorker = queryRunner.manager.create(Worker, {
        id: savedUser.id, // Sincronización de IDs (OneToOne)
        nombre: dto.nombre,
        apellidos: dto.apellidos,
        email: cleanEmail,
        telefono: dto.telefono,
        dni: cleanDni,
        empresa: { id: empresaId }, // Vinculación por relación
        
        // Resto de datos del DTO...
        fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : null,
        calle: dto.calle,
        poblacion: dto.poblacion,
        provincia: dto.provincia,
        pais: dto.pais,
        categoria: dto.categoria,
        actividad: dto.actividad,
        diaPertenece: dto.diaPertenece,
        
        rol: UserRole.WORKER,
        isActive: true,
        isVerified: true,
        password: hashedPassword, // Si la entidad Worker también guarda password (redundante pero posible)
      } as DeepPartial<Worker>);

      const savedWorker = await queryRunner.manager.save(Worker, newWorker);

      await queryRunner.commitTransaction();

      return {
        message: 'Trabajador creado exitosamente',
        worker: savedWorker
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      // Manejo de errores de duplicidad (Postgres code 23505)
      if (error.code === '23505') {
        throw new BadRequestException('El correo, DNI o teléfono ya existen.');
      }
      throw new InternalServerErrorException('Error al crear trabajador: ' + error.message);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Lista todos los workers (Solo para Admin)
   */
  async findAll() {
    return await this.workerRepository.find({
      relations: ['empresa'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Lista workers filtrando por empresa (Para Admin normal)
   */
  async findAllByEmpresa(empresaId: number) {
    return await this.workerRepository.find({
      where: { empresa: { id: empresaId } }, // Uso seguro de la relación
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Busca un worker asegurando que pertenezca a la empresa del admin
   */
  async findOne(id: number, user: UserPayload) { // ✅ Recibe UserPayload
    const whereCondition: any = { id };
    
    // Si no es SuperAdmin, forzamos el filtro de empresa
    if (user.rol !== UserRole.SUPERADMIN) {
      if (!user.empresaId) throw new ForbiddenException('Usuario sin empresa');
      whereCondition.empresa = { id: user.empresaId };
    }

    const worker = await this.workerRepository.findOne({
      where: whereCondition,
      relations: ['empresa', 'horario'] // Cargar relaciones útiles
    });

    if (!worker) {
      throw new NotFoundException('Trabajador no encontrado o no tienes permisos');
    }
    return worker;
  }

  /**
   * Actualiza un worker
   */
async update(id: number, dto: UpdateWorkerDto, user: UserPayload) {
    // 1. Verificamos que el trabajador existe y pertenece a la empresa
    const worker = await this.findOne(id, user);

    // 2. Validaciones preventivas de duplicidad (Excluyendo al propio worker)
    
    // Validar DNI
    if (dto.dni) {
      const dniLimpio = dto.dni.toUpperCase().trim();
      const dniDuplicado = await this.workerRepository.findOne({
        where: { 
          dni: dniLimpio, 
          id: Not(id) // 👈 "Busca este DNI pero que el ID NO sea el mío"
        }
      });
      if (dniDuplicado) {
        throw new BadRequestException(`El DNI '${dniLimpio}' ya está registrado por otro trabajador.`);
      }
      dto.dni = dniLimpio;
    }

    // Validar Email
    if (dto.email) {
      const emailLimpio = dto.email.toLowerCase().trim();
      const emailDuplicado = await this.workerRepository.findOne({
        where: { 
          email: emailLimpio, 
          id: Not(id) // 👈 "Busca este email pero que el ID NO sea el mío"
        }
      });
      if (emailDuplicado) {
        throw new BadRequestException(`El correo '${emailLimpio}' ya está en uso por otro trabajador.`);
      }
      dto.email = emailLimpio;
    }

    // Validar Teléfono
    if (dto.telefono) {
      const telDuplicado = await this.workerRepository.findOne({
        where: { 
          telefono: dto.telefono, 
          id: Not(id) 
        }
      });
      if (telDuplicado) {
        throw new BadRequestException(`El teléfono '${dto.telefono}' ya pertenece a otro trabajador.`);
      }
    }

    // 3. Sincronizar con la tabla User si es necesario (Auth)
    if (dto.email || dto.nombre || dto.password) {
      const userUpdateData: any = {};
      if (dto.email) userUpdateData.email = dto.email.toLowerCase().trim();
      if (dto.nombre) userUpdateData.nombre = dto.nombre;
      if (dto.password) userUpdateData.password = await bcrypt.hash(dto.password, 10);

      await this.dataSource.getRepository(User).update(id, userUpdateData);
    }

    // 4. Aplicar cambios y guardar
    Object.assign(worker, dto);

    try {
      return await this.workerRepository.save(worker);
    } catch (error) {
      // Manejo de errores de base de datos (por si acaso)
      if (error.code === '23505') {
        throw new BadRequestException('Error de duplicidad: uno de los campos únicos ya existe en la base de datos.');
      }
      throw new InternalServerErrorException('Error al actualizar el trabajador');
    }
  }

  /**
   * Elimina un worker (y su usuario asociado)
   */
  async remove(id: number, user: UserPayload) {
    // 1. Verificar permisos
    await this.findOne(id, user);

    try {
      // Al borrar el User, el Worker se borra por cascade (si está configurado en la entidad)
      // Si no, borra el worker y luego el user.
      await this.dataSource.getRepository(User).delete(id);
      return { message: 'Trabajador eliminado correctamente' };
    } catch (error) {
      throw new InternalServerErrorException('No se pudo eliminar el trabajador');
    }
  }

  /**
   * Asigna horario
   */
 async assignSchedule(workerId: number, horarioId: number, user: UserPayload) {
  // 1. Validar trabajador (Filtra por empresa del admin)
  const worker = await this.findOne(workerId, user);

  // 2. Validar ID de empresa para TypeScript
  const empresaId = user.empresaId;
  if (!empresaId) {
    throw new UnauthorizedException('El administrador debe tener una empresa asignada');
  }

  // 3. Validar que el horario existe y pertenece a la empresa
  const horario = await this.dataSource.getRepository(Horario).findOne({
    where: { 
      id: horarioId, 
      empresa: { id: empresaId } 
    }
  });

  if (!horario) {
    throw new NotFoundException(`El horario con ID ${horarioId} no existe en tu empresa`);
  }

  // 4. Actualización Sincronizada (Ambas tablas)
  try {
  await this.dataSource.transaction(async (manager) => {
    // 1. Actualizamos Worker
    // Usamos 'as any' o el objeto de relación para saltar la restricción del QueryDeepPartial
    await manager.update(Worker, workerId, { 
      horario: { id: horarioId } 
    } as any);

    // 2. Actualizamos User
    await manager.update(User, workerId, { 
      horario: { id: horarioId } 
    } as any);
  });

  return { 
    message: 'Horario asignado correctamente en ambas tablas', 
    worker: worker.nombre,
    horario: horario.nombre 
  };

  } catch (error) {
    throw new InternalServerErrorException('Error al sincronizar el horario en las tablas de usuario y trabajador');
  }
}
}