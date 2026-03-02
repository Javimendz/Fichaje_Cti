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
import { User } from '../auth/entities/user.entity'; 

// DTOs e Interfaces
import { CreateWorkerDto } from './dto/worker.dto'; 
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { UserRole } from '../auth/roles.enum';
import type { UserPayload } from '../auth/interfaces/user-payload.interface'; 
import { Horario } from 'schedule/entities/schedules.entity';


// El servicio de Worker se encarga de toda la lógica de negocio relacionada con los trabajadores, incluyendo la creación, actualización, eliminación y consulta de trabajadores. Además, maneja la sincronización entre las tablas de User y Worker para asegurar que los datos estén consistentes. El servicio utiliza transacciones para garantizar que las operaciones que afectan a ambas tablas se realicen de manera atómica, evitando problemas de datos inconsistentes en caso de errores. También incluye validaciones para asegurar que los datos sean únicos y que los usuarios tengan los permisos adecuados para realizar acciones relacionadas con los trabajadores.
/**
 * * * WorkerService
 * * Gestiona toda la lógica de negocio relacionada con los trabajadores, incluyendo la creación, actualización, eliminación y consulta de trabajadores. Además, maneja la sincronización entre las tablas de User y Worker para asegurar que los datos estén consistentes. El servicio utiliza transacciones para garantizar que las operaciones que afectan a ambas tablas se realicen de manera atómica, evitando problemas de datos inconsistentes en caso de errores. También incluye validaciones para asegurar que los datos sean únicos y que los usuarios tengan los permisos adecuados para realizar acciones relacionadas con los trabajadores.
 * * Este servicio es fundamental para la gestión de los trabajadores dentro del sistema, ya que cada trabajador está asociado a una empresa y tiene un rol específico. La gestión de los trabajadores incluye la creación, actualización, eliminación y consulta de trabajadores, y todas estas operaciones deben ser controladas estrictamente en función del rol del usuario que realiza la acción (SuperAdmin o Admin). El servicio delega toda la lógica de negocio y validación al WorkerService, manteniendo el controlador limpio y enfocado en manejar las solicitudes HTTP y la seguridad de acceso.
 * */
@Injectable()
export class WorkerService {
  constructor(
    @InjectRepository(Worker)
    private readonly workerRepository: Repository<Worker>,
    private readonly dataSource: DataSource, // Necesario para transacciones
  ) {}

  /**
   * Crea un Usuario (Login) y un Worker (Datos) en una sola transacción.
    * @param dto DTO con los datos necesarios para crear el trabajador, incluyendo email, password, nombre, etc.
    * @param admin Usuario autenticado que realiza la solicitud, utilizado para validar permisos y asignar empresaId al nuevo trabajador.
    * @return El trabajador creado. Si la creación falla por validación o permisos, se lanzará una excepción que será manejada por el WorkerController.
    * Este método es el único punto de entrada para crear un trabajador, y se encarga de validar que el usuario autenticado tiene una empresa asignada (si no es SuperAdmin), y luego realiza la creación de manera atómica utilizando una transacción. Si cualquier parte del proceso falla (validación, creación del usuario, creación del trabajador), la transacción se revertirá automáticamente, asegurando que no queden datos inconsistentes en la base de datos. Además, se manejan errores específicos como duplicidad de email o DNI para proporcionar mensajes claros al cliente.
    * Nota: Si en el futuro decides permitir que un SuperAdmin cree trabajadores sin necesidad de una empresa asignada, puedes ajustar la lógica de validación para permitir que el campo empresaId sea opcional solo para SuperAdmin, mientras que para Admins seguirá siendo obligatorio.
   *
  */
  async create(dto: CreateWorkerDto, admin: UserPayload) { 
    
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
        horario: dto.horarioId ? { id: dto.horarioId } as Horario : null, // Relación con Horario si se proporciona
      } as DeepPartial<User>);

      const savedUser = await queryRunner.manager.save(User, newUser);

      // 3. Crear instancia de WORKER (Perfil)
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
        actividadId: dto.actividadId,
        diaPertenece: dto.diaPertenece,
        horarioId: dto.horarioId,
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
  /**
   *  Lista todos los trabajadores del sistema. Este método está diseñado para ser utilizado por usuarios con rol de Admin, y devuelve una lista completa de trabajadores sin filtrar por empresa. La lógica de filtrado por empresa se maneja en el controlador, donde se verifica el rol del usuario autenticado y se llama a este método solo si el usuario es un SuperAdmin. Si el usuario es un Admin normal, se llama a otro método que filtra los trabajadores por la empresa del Admin. Este enfoque permite mantener la lógica de negocio centralizada en el servicio, mientras que el controlador se encarga de manejar la seguridad y las rutas específicas para cada tipo de usuario.
   * @returns Lista de todos los trabajadores del sistema. Si el usuario autenticado no tiene permisos para acceder a esta información, se lanzará una excepción que será manejada por el WorkerController.
   * Nota: Si en el futuro decides permitir que un Admin normal también pueda listar todos los trabajadores sin filtrar por empresa, puedes ajustar la lógica de seguridad en el controlador para llamar a este método independientemente del rol del usuario, o agregar una condición dentro de este método para verificar el rol y aplicar el filtro de empresa solo si el usuario es un Admin normal.      
  
   */
  async findAll() {
    return await this.workerRepository.find({
      relations: ['empresa'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Lista workers filtrando por empresa (Para Admin normal)
   * Este método se utiliza para listar los trabajadores asociados a la empresa del Admin normal. El controlador se encarga de verificar el rol del usuario autenticado y llamar a este método solo si el usuario es un Admin normal, pasando su empresaId como parámetro. Si el usuario es un SuperAdmin, se llama al método findAll() que devuelve todos los trabajadores sin filtrar por empresa. Este enfoque permite mantener la lógica de negocio centralizada en el servicio, mientras que el controlador se encarga de manejar la seguridad y las rutas específicas para cada tipo de usuario.
   * @param empresaId ID de la empresa para filtrar los trabajadores. Este valor se obtiene del usuario autenticado (Admin normal) y se pasa desde el controlador.
   * @return Lista de trabajadores asociados a la empresa especificada. Si el usuario autenticado no tiene permisos para acceder a esta información, se lanzará una excepción que será manejada por el WorkerController.
   * Nota: Si en el futuro decides permitir que un Admin normal también pueda listar todos los trabajadores sin filtrar por empresa, puedes ajustar la lógica de seguridad en el controlador para llamar al método findAll() independientemente del rol del usuario, o agregar una condición dentro de este método para verificar el rol y aplicar el filtro de empresa solo si el usuario es un Admin normal.
   */
  async findAllByEmpresa(empresaId: number) {
    return await this.workerRepository.find({
      where: { empresa: { id: empresaId } }, // Uso seguro de la relación
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Busca un worker asegurando que pertenezca a la empresa del admin
   * Este método se utiliza para buscar un trabajador por su ID, asegurando que el trabajador pertenezca a la empresa del Admin normal que realiza la solicitud. El controlador se encarga de verificar el rol del usuario autenticado y llamar a este método solo si el usuario es un Admin normal, pasando su empresaId como parte del UserPayload. Si el usuario es un SuperAdmin, se llama a otro método que busca el trabajador sin filtrar por empresa. Este enfoque permite mantener la lógica de negocio centralizada en el servicio, mientras que el controlador se encarga de manejar la seguridad y las rutas específicas para cada tipo de usuario.
   * @param id ID del trabajador a buscar, validado como número entero mediante ParseIntPipe en el controlador.
   * @param user Usuario autenticado que realiza la solicitud, utilizado para validar permisos y filtrar por empresa. El UserPayload debe incluir el rol del usuario y el ID de la empresa a la que pertenece (si es un Admin normal).
   * @return El trabajador solicitado si pertenece a la empresa del Admin normal. Si el trabajador no existe, no pertenece a la empresa del Admin, o el usuario autenticado no tiene permisos para acceder a esta información, se lanzará una excepción que será manejada por el WorkerController.
   * Nota: Si en el futuro decides permitir que un Admin normal también pueda buscar trabajadores sin filtrar por empresa, puedes ajustar la lógica de seguridad en el controlador para llamar a este método independientemente del rol del usuario, o agregar una condición dentro de este método para verificar el rol y aplicar el filtro de empresa solo si el usuario es un Admin normal.
   */
  async findOne(id: number, user: UserPayload) {
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
   * Este método se utiliza para actualizar la información de un trabajador específico. El controlador se encarga de verificar el rol del usuario autenticado y llamar a este método solo si el usuario tiene permisos para actualizar el trabajador (Admin normal solo puede actualizar trabajadores de su empresa, mientras que un SuperAdmin puede actualizar cualquier trabajador). El método realiza validaciones para asegurar que los datos actualizados no generen duplicidades (como email o DNI), y maneja la sincronización entre las tablas de User y Worker si se actualizan campos relacionados con la autenticación (email, nombre, password). Si la actualización falla por validación, permisos o errores de base de datos, se lanzará una excepción que será manejada por el WorkerController.
   * @param id ID del trabajador a actualizar, validado como número entero mediante ParseIntPipe en el controlador.
   * @param dto DTO con los datos a actualizar del trabajador. Puede incluir campos como nombre, email, teléfono, etc.
   * @param user Usuario autenticado que realiza la solicitud, utilizado para validar permisos y acceso al trabajador a actualizar. Un Admin solo puede actualizar trabajadores de su empresa, mientras que un SuperAdmin puede actualizar cualquier trabajador.
   * @return El trabajador actualizado. Si el trabajador no existe, el solicitante no tiene acceso a él, o la actualización falla por validación o permisos, se lanzará una excepción que será manejada por el WorkerController.
   * Nota: Si en el futuro decides permitir que un Admin normal también pueda actualizar trabajadores sin filtrar por empresa, puedes ajustar la lógica de seguridad en el controlador para llamar a este método independientemente del rol del usuario, o agregar una condición dentro de este método para verificar el rol y aplicar el filtro de empresa solo si el usuario es un Admin normal. Además, si decides permitir que un SuperAdmin actualice cualquier trabajador sin necesidad de validar la empresa, asegúrate de que la lógica de validación y actualización se ajuste correctamente para manejar ambos casos (SuperAdmin sin filtro de empresa y Admin con filtro de empresa).
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
          id: Not(id) //  "Busca este DNI pero que el ID NO sea el mío"
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
          id: Not(id) //  "Busca este email pero que el ID NO sea el mío"
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
  if (dto.email || dto.nombre || dto.password || 'horarioId' in dto) {
      const userUpdateData: any = {};
      
      if (dto.email) userUpdateData.email = dto.email;
      if (dto.nombre) userUpdateData.nombre = dto.nombre;
      if (dto.password) userUpdateData.password = await bcrypt.hash(dto.password, 10);
      
      if ('horarioId' in dto) {
        userUpdateData.horario = dto.horarioId ? { id: dto.horarioId } : null;
      }

      // Actualizamos en la tabla User
      await this.dataSource.getRepository(User).update(id, userUpdateData);
    }
    // 4. Aplicar cambios y guardar
    Object.assign(worker, dto);
    if ('horarioId' in dto) {
      if (dto.horarioId) {
        // Si hay un nuevo ID, le asignamos un objeto con ese ID
        worker.horario = { id: dto.horarioId } as any;
      } else {
        // Si mandaron null o vacío, vaciamos la relación
        worker.horario = null as any;
      }
    }
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
   * Este método se utiliza para eliminar un trabajador específico del sistema. El controlador se encarga de verificar el rol del usuario autenticado y llamar a este método solo si el usuario tiene permisos para eliminar el trabajador (Admin normal solo puede eliminar trabajadores de su empresa, mientras que un SuperAdmin puede eliminar cualquier trabajador). Al eliminar un trabajador, también se elimina su usuario asociado para mantener la integridad de los datos. Si la eliminación falla por permisos o errores de base de datos, se lanzará una excepción que será manejada por el WorkerController.
   * @param id ID del trabajador a eliminar, validado como número entero mediante ParseIntPipe en el controlador.
   * @param user Usuario autenticado que realiza la solicitud, utilizado para validar permisos y acceso al trabajador a eliminar. Un Admin solo puede eliminar trabajadores de su empresa, mientras que un SuperAdmin puede eliminar cualquier trabajador.
   * @return Un mensaje de éxito si el trabajador se elimina correctamente. Si el trabajador no existe, el solicitante no tiene acceso a él, o la eliminación falla por permisos o errores de base de datos, se lanzará una excepción que será manejada por el WorkerController.
   * Nota: Si en el futuro decides permitir que un Admin normal también pueda eliminar trabajadores sin filtrar por empresa, puedes ajustar la lógica de seguridad en el controlador para llamar a este método independientemente del rol del usuario, o agregar una condición dentro de este método para verificar el rol y aplicar el filtro de empresa solo si el usuario es un Admin normal. Además, si decides permitir que un SuperAdmin elimine cualquier trabajador sin necesidad de validar la empresa, asegúrate de que la lógica de validación y eliminación se ajuste correctamente para manejar ambos casos (SuperAdmin sin filtro de empresa y Admin con filtro de empresa).  
   * 
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
   * Este método se utiliza para asignar un horario específico a un trabajador. El controlador se encarga de verificar el rol del usuario autenticado y llamar a este método solo si el usuario tiene permisos para asignar horarios a ese trabajador (Admin normal solo puede asignar horarios a trabajadores de su empresa, mientras que un SuperAdmin puede asignar horarios a cualquier trabajador). El método realiza validaciones para asegurar que el trabajador existe, pertenece a la empresa del Admin normal (si aplica), y que el horario existe y pertenece a la misma empresa. La asignación del horario se realiza de manera sincronizada en ambas tablas (User y Worker) utilizando una transacción para garantizar la consistencia de los datos. Si la asignación falla por validación, permisos o errores de base de datos, se lanzará una excepción que será manejada por el WorkerController.
   * @param workerId ID del trabajador al que se le asignará el horario, validado como número entero mediante ParseIntPipe en el controlador.
   * @param horarioId ID del horario a asignar, validado como número entero mediante ParseIntPipe en el controlador.
   * @param user Usuario autenticado que realiza la solicitud, utilizado para validar permisos y acceso al trabajador al que se le asignará el horario. Un Admin solo puede asignar horarios a trabajadores de su empresa, mientras que un SuperAdmin puede asignar horarios a cualquier trabajador.
   * @return Un mensaje de éxito si el horario se asigna correctamente. Si el trabajador no existe, el horario no existe, el solicitante no tiene permisos para realizar la asignación, o la asignación falla por validación o errores de base de datos, se lanzará una excepción que será manejada por el WorkerController.
   * Nota: Si en el futuro decides permitir que un Admin normal también pueda asignar horarios sin filtrar por empresa, puedes ajustar la lógica de seguridad en el controlador para llamar a este método independientemente del rol del usuario, o agregar una condición dentro de este método para verificar el rol y aplicar el filtro de empresa solo si el usuario es un Admin normal. Además, si decides permitir que un SuperAdmin asigne horarios sin necesidad de validar la empresa, asegúrate de que la lógica de validación y asignación se ajuste correctamente para manejar ambos casos (SuperAdmin sin filtro de empresa y Admin con filtro de empresa).
   */
 async assignSchedule(workerId: number, horarioId: number, user: UserPayload) {
    // 1. VALIDACIÓN DE SEGURIDAD (El Admin debe tener empresa)
    if (!user.empresaId) {
      throw new UnauthorizedException('No tienes una empresa asignada para gestionar horarios');
    }

    // 2. BUSCAR TRABAJADOR (Validando que pertenezca a la empresa del Admin)
    // No necesitamos cargar relaciones pesadas, solo verificar existencia y empresa
    const worker = await this.workerRepository.findOne({
      where: { 
        id: workerId, 
        empresaId: user.empresaId // Usamos la columna física para filtrar rápido
      }
    });

    if (!worker) {
      throw new NotFoundException(`El trabajador con ID ${workerId} no existe en tu empresa`);
    }

    // 3. BUSCAR HORARIO (Validando que pertenezca a la empresa del Admin)
    const horario = await this.dataSource.getRepository(Horario).findOne({
      where: { 
        id: horarioId, 
        empresa: { id: user.empresaId } // O empresaId si la definiste en Horario como readonly
      }
    });

    if (!horario) {
      throw new NotFoundException(`El horario con ID ${horarioId} no existe en tu empresa`);
    }

    // 4. TRANSACCIÓN DE ACTUALIZACIÓN
    // Usamos una transacción para asegurar que si falla User, no se actualice Worker (y viceversa)
    try {
      await this.dataSource.transaction(async (manager) => {
        
        // A) Actualizar WORKER
        // ALERTA: Tu entidad tiene 'horarioId'. Usar esto es lo más seguro.
        await manager.update(Worker, workerId, { 
          horarioId: horarioId // Actualización directa a la columna física
        }as any);

        // B) Actualizar USER
        // Como Worker.id === User.id (Shared Primary Key), usamos el mismo 'workerId'.
        // Nota: Esto asume que la entidad User también tiene una relación con Horario.
        await manager.update(User, workerId, { 
           // Si en User no tienes 'horarioId' columna, usa la relación:
           horario: { id: horarioId } 
        });
      });

      return { 
        message: 'Horario asignado correctamente', 
        workerId: worker.id,
        horarioAsignado: horario.nombre 
      };

    } catch (error) {
      console.error('Error en transacción assignSchedule:', error);
      throw new InternalServerErrorException('Error al sincronizar el horario en las tablas');
    }
  }

}