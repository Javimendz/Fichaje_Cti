import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  Logger
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, DeepPartial, Not, In } from 'typeorm';
import * as bcrypt from 'bcrypt';

// Entidades
import { Worker } from './entities/worker.entity';
import { User } from '../auth/entities/user.entity';
import { createHmac } from 'crypto';
// DTOs e Interfaces
import { CreateWorkerDto } from './dto/worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { UserRole } from '../auth/roles.enum';
import type { UserPayload } from '../auth/interfaces/user-payload.interface';
import { Horario } from '../schedule/entities/schedules.entity';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { LoginPinDto } from './dto/login-pin.dto';
import { LoginMasterDto } from './dto/login-master.dto';
import { MasterPinGenerationDto } from './dto/master-pin.dto';
import { Company } from '../company/entities/company.entity';
import { AssignWorkerDto } from '../site/dto/assign-worker.dto';
import { Site } from '../site/entities/site.entity';
import { MailService } from '../mail/mail.service';

// El servicio de Worker se encarga de toda la lógica de negocio relacionada con los trabajadores, incluyendo la creación, actualización, eliminación y consulta de trabajadores. Además, maneja la sincronización entre las tablas de User y Worker para asegurar que los datos estén consistentes. El servicio utiliza transacciones para garantizar que las operaciones que afectan a ambas tablas se realicen de manera atómica, evitando problemas de datos inconsistentes en caso de errores. También incluye validaciones para asegurar que los datos sean únicos y que los usuarios tengan los permisos adecuados para realizar acciones relacionadas con los trabajadores.
/**
 * * * WorkerService
 * * Gestiona toda la lógica de negocio relacionada con los trabajadores, incluyendo la creación, actualización, eliminación y consulta de trabajadores. Además, maneja la sincronización entre las tablas de User y Worker para asegurar que los datos estén consistentes. El servicio utiliza transacciones para garantizar que las operaciones que afectan a ambas tablas se realicen de manera atómica, evitando problemas de datos inconsistentes en caso de errores. También incluye validaciones para asegurar que los datos sean únicos y que los usuarios tengan los permisos adecuados para realizar acciones relacionadas con los trabajadores.
 * * Este servicio es fundamental para la gestión de los trabajadores dentro del sistema, ya que cada trabajador está asociado a una empresa y tiene un rol específico. La gestión de los trabajadores incluye la creación, actualización, eliminación y consulta de trabajadores, y todas estas operaciones deben ser controladas estrictamente en función del rol del usuario que realiza la acción (SuperAdmin o Admin). El servicio delega toda la lógica de negocio y validación al WorkerService, manteniendo el controlador limpio y enfocado en manejar las solicitudes HTTP y la seguridad de acceso.
 * */
@Injectable()
export class WorkerService {
  logger = new Logger(WorkerService.name);
  constructor(
    @InjectRepository(Worker)
    private readonly workerRepository: Repository<Worker>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly authService: AuthService,
    @InjectRepository(Site) private readonly siteRepository: Repository<Site>,

    private readonly mailService: MailService,
    private readonly dataSource: DataSource, // Necesario para transacciones
    private configService: ConfigService,
  ) { }

  /**
   * Crea un Usuario (Login) y un Worker (Datos) en una sola transacción.
    * @param dto DTO con los datos necesarios para crear el trabajador, incluyendo email, password, nombre, etc.
    * @param admin Usuario autenticado que realiza la solicitud, utilizado para validar permisos y asignar empresaId al nuevo trabajador.
    * @return El trabajador creado. Si la creación falla por validación o permisos, se lanzará una excepción que será manejada por el WorkerController.
    * Este método es el único punto de entrada para crear un trabajador, y se encarga de validar que el usuario autenticado tiene una empresa asignada (si no es SuperAdmin), y luego realiza la creación de manera atómica utilizando una transacción. Si cualquier parte del proceso falla (validación, creación del usuario, creación del trabajador), la transacción se revertirá automáticamente, asegurando que no queden datos inconsistentes en la base de datos. Además, se manejan errores específicos como duplicidad de email o DNI para proporcionar mensajes claros al cliente.
    * Nota: Si en el futuro decides permitir que un SuperAdmin cree trabajadores sin necesidad de una empresa asignada, puedes ajustar la lógica de validación para permitir que el campo empresaId sea opcional solo para SuperAdmin, mientras que para Admins seguirá siendo obligatorio.
   *
  */
  // src/worker/worker.service.ts


async generatePinWithToken(dto: { dni: string }) {
  // 1. Buscar al trabajador por DNI
  const worker = await this.userRepo.findOne({ where: { dni: dto.dni } });
  if (!worker) {
    throw new NotFoundException(`No se encontró ningún trabajador con el DNI: ${dto.dni}`);
  }

  // 2. Generar el PIN aleatorio de 6 dígitos
  const rawPin = Math.floor(100000 + Math.random() * 900000).toString();

  // 3. Cifrado SHA-256 con Pepper (Pimienta)
  const secret = this.configService.get<string>('PIN_PEPPER');
  if (!secret) {
    throw new InternalServerErrorException('Error de configuración: Falta PIN_PEPPER');
  }

  const hashedPin = createHmac('sha256', secret)
    .update(rawPin)
    .digest('hex');

  // 4. Guardar hash en BD
  const now = new Date();
await this.userRepo.update(worker.id, { 
  pin: hashedPin, 
  pinUpdatedAt: now 
});

// Opcional: Actualizar el objeto en memoria por si lo usas después
worker.pin = hashedPin;
worker.pinUpdatedAt = now;

  // 5. Respuesta (Solo aquí se ve el PIN plano)
  return {
    message: `PIN generado con éxito mediante autorización maestra, ${rawPin}`,
    worker: `${worker.nombre} ${worker.apellidos}`,
    pin: rawPin 
  };
}


// --- PASO 1: Login de Configuración de Empresa ---
async loginCompanyConfig(dto: { empresaId: number; password: string }) {
  // 1. Buscamos la empresa forzando la lectura del password
  const company = await this.dataSource.getRepository(Company)
    .createQueryBuilder('company')
    .addSelect('company.configPassword') 
    .where('company.id = :id', { id: dto.empresaId })
    .getOne();

  if (!company) {
    throw new NotFoundException('Empresa no encontrada');
  }

  if(!company.configPassword) {
    throw new InternalServerErrorException('Error de configuración: Falta configPassword');
  }
  // 2. 🛡️ VALIDACIÓN DE CONTRASEÑA CON BCRYPT
  // Ahora usamos compare porque en CompanyService la guardas con hash
const isPasswordValid = await bcrypt.compare(dto.password, company.configPassword);
  if (!isPasswordValid) {
    this.logger.warn(`Intento de acceso fallido a zona privada - Empresa ID: ${dto.empresaId}`);
    throw new UnauthorizedException('Contraseña de configuración de empresa incorrecta');
  }

  // 3. Generamos el Payload para el Token
  const payload = {
    sub: 'COMPANY_CONFIG', 
    id: 0,
    userId: 0,
    nombre: 'CONFIG_MODE',
    apellido: company.nombre,
    rol: UserRole.ADMIN, 
    dni: `CONFIG_${company.id}`,
    email: `tablet@${company.nombre.replace(/\s/g, '').toLowerCase()}.com`,
    empresaId: company.id,
  };

  this.logger.log(`[AUTH] Zona privada de "${company.nombre}" accedida correctamente.`);
  
  return await this.authService.generateJwt(payload);
}


async activateWorkerPin(dni: string, empresaId: number) {
  // Usamos QueryBuilder para ver el campo 'pin' que tiene { select: false }
  const user = await this.userRepo.createQueryBuilder('user')
    .addSelect('user.pin') 
    .where('user.dni = :dni', { dni: dni.trim().toUpperCase() })
    .andWhere('user.empresaId = :empresaId', { empresaId })
    .getOne();

  if (!user) {
    throw new NotFoundException(`No se ha encontrado ningún trabajador con DNI ${dni} en tu empresa.`);
  }

  // LOGICA DE PERSISTENCIA:
  // Si el usuario ya tiene un PIN en la base de datos (un hash), NO generamos uno nuevo.
  if (user.pin) {
    await this.userRepo.update(user.id, {
      isPinActive: true,
      pinUpdatedAt: new Date()
    });

    return { 
      message: `El acceso de ${user.nombre} ha sido habilitado. Debe usar su PIN original.`,
      worker: `${user.nombre} ${user.apellidos || ''}`,
      dni: user.dni,
      pin: "Utilice el PIN recibido al crear el trabajador", 
      status: 'ACTIVE'
    };
  }

  // CASO EXCEPCIONAL: Si por alguna razón el PIN es NULL en la BD, generamos uno nuevo.
  const rawPin = Math.floor(100000 + Math.random() * 900000).toString();
  const secret = this.configService.get<string>('PIN_PEPPER');
  
  if (!secret) throw new InternalServerErrorException('Falta PIN_PEPPER en el entorno');

  const hashedPin = createHmac('sha256', secret).update(rawPin).digest('hex');

  await this.userRepo.update(user.id, {
    pin: hashedPin,
    isPinActive: true,
    pinUpdatedAt: new Date()
  });

  return {
    message: 'Activación completada. Se ha generado un nuevo PIN porque no existía uno previo.',
    worker: `${user.nombre} ${user.apellidos || ''}`,
    dni: user.dni,
    pin: rawPin,
    status: 'ACTIVE'
  };
}

async loginWithOnlyPin(dto: LoginPinDto) {
  const secret = this.configService.get<string>('PIN_PEPPER');
  if (!secret) throw new InternalServerErrorException('Error: PIN_PEPPER no definido');

  // 1. Limpieza rigurosa del input
  const cleanPin = String(dto.pin).trim();
  
  // 2. Generar el Hash para comparar
  const hashedPin = createHmac('sha256', secret)
    .update(cleanPin)
    .digest('hex');

  // 3. Buscamos al usuario que coincida con ese hash y esté habilitado
  // Usamos QueryBuilder para evitar problemas con la visibilidad de la columna pin
  const user = await this.userRepo.createQueryBuilder('user')
    .leftJoinAndSelect('user.empresa', 'empresa')
    .where('user.pin = :hashedPin', { hashedPin })
    .andWhere('user.isPinActive = :active', { active: true })
    .andWhere('user.isActive = :global', { global: true })
    .getOne();

  if (!user) {
    this.logger.warn(`Intento de login fallido con PIN.`);
    throw new UnauthorizedException('PIN incorrecto o acceso no habilitado');
  }

  return await this.authService.generateJwt(user);
}

async create(dto: CreateWorkerDto, admin: UserPayload) {
  // 1. Validar que el ADMIN que crea realmente tiene empresa
  const empresaId = admin.empresaId;
  if (!empresaId) {
    throw new UnauthorizedException('Tu cuenta de administrador no tiene una empresa vinculada.');
  }

  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // A) Preparación de credenciales
    const hashedPassword = bcrypt.hashSync(dto.password, 10);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // B) Generación de PIN seguro (HMAC-SHA256)
    const rawPin = Math.floor(100000 + Math.random() * 900000).toString();
    const secret = this.configService.get<string>('PIN_PEPPER');
    if (!secret) {
      throw new InternalServerErrorException('Error de configuración: PIN_PEPPER no definido');
    }

    const hashedPin = createHmac('sha256', secret)
      .update(rawPin)
      .digest('hex');

    // 2. Crear USUARIO (Tabla 'users' - AUTH)
    // Aquí es donde reside la "llave" de acceso
    const newUser = queryRunner.manager.create(User, {
      ...dto, // Trae email, nombre, apellidos, telefono, dni
      email: dto.email.toLowerCase().trim(),
      dni: dto.dni.toUpperCase().trim(),
      password: hashedPassword,
      pin: hashedPin,       // ✅ Guardado en tabla User
      isPinActive: false,   // ✅ Nace desactivado por seguridad
      empresaId: empresaId,
      isActive: true,
      rol: UserRole.WORKER,
      fechaInicioHorario: dto.horarioId ? hoy : null,
    });

    const savedUser = await queryRunner.manager.save(User, newUser);

    // 3. Crear WORKER (Tabla 'workers' - PERFIL)
    // Solo datos informativos y relación 1:1
    const newWorker = queryRunner.manager.create(Worker, {
      ...dto, // TypeScript ignorará los campos que ya no están en la entidad Worker
      id: savedUser.id, // Sincronización de IDs
      dni: savedUser.dni,
      empresaId: empresaId,
      isActive: true,
      fechaInicioHorario: savedUser.fechaInicioHorario,
    });

    await queryRunner.manager.save(Worker, newWorker);
    
    // Confirmar transacción
    await queryRunner.commitTransaction();

    this.logger.log(`[ALTA] Trabajador ${savedUser.dni} creado. PIN generado y guardado en tabla User.`);


    try {
  await this.mailService.sendWorkerPin({
    email: savedUser.email,
    nombre: savedUser.nombre,
    pin: rawPin,
    esNuevoPin: false
  });
} catch (mailError) {
  const error = mailError as Error; // 🚩 Le decimos a TS: "Confía en mí, es un Error"
  this.logger.error(`Falló el envío de correo al trabajador ${savedUser.id}: ${error.message}`);
  // Aquí decides: ¿lanzas error o solo logueas? 
  // Lo ideal es que el admin sepa que el usuario existe pero el mail falló.
}
    // 4. Respuesta (El Admin recibe el PIN para dárselo al empleado)
    return { 
      message: 'Trabajador creado con éxito', 
      id: savedUser.id,
      dni: savedUser.dni,
      pin: rawPin // 👈 Única vez que se muestra el PIN plano
    };

  } catch (error: any) {
    await queryRunner.rollbackTransaction();

    if (error.code === '23505') {
      const campoMatch = error.detail?.match(/\((.*?)\)/)?.[1] || 'campo';
      throw new BadRequestException(`El [${campoMatch}] ya está registrado.`);
    }

    throw new InternalServerErrorException('Error crítico al crear el trabajador: ' + error.message);
  } finally {
    await queryRunner.release();
  }
}

  async regeneratePinWithToken(dni: string, admin: UserPayload) {
    const cleanDni = dni.trim().toUpperCase();

    // 1. Buscamos al trabajador asegurándonos de que pertenece a la empresa del Admin
    const worker = await this.userRepo.findOne({ 
      where: { 
        dni: cleanDni, 
        empresaId: admin.empresaId 
      } 
    });

    if (!worker) {
      throw new NotFoundException(`No se encontró a ningún trabajador con DNI ${cleanDni} en tu empresa.`);
    }

    // 2. Generamos el nuevo PIN aleatorio (6 dígitos)
    const rawPin = Math.floor(100000 + Math.random() * 900000).toString();
    const secret = this.configService.get<string>('PIN_PEPPER');
    
    if (!secret) {
      throw new InternalServerErrorException('Falta configurar PIN_PEPPER en el servidor');
    }

    // 3. Trituramos el PIN (Hash)
    const hashedPin = createHmac('sha256', secret).update(rawPin).digest('hex');

    // 4. Guardamos en la base de datos
    await this.userRepo.update(worker.id, { 
      pin: hashedPin, 
      pinUpdatedAt: new Date(),
      isPinActive: true // 🚩 Al generarlo el jefe a mano, lo damos por activado automáticamente
    });

    // 5. AUDITORÍA: Dejamos rastro en la consola del servidor
    this.logger.warn(`[AUDITORÍA] El Administrador ${admin.nombre} (ID: ${admin.id}) ha reseteado el PIN del trabajador ${worker.nombre} (ID: ${worker.id}).`);


   try {
      await this.mailService.sendWorkerPin({
        email: worker.email,
        nombre: worker.nombre,
        pin: rawPin,
        esNuevoPin: true // 🚩 Condiciona una plantilla de "PIN Modificado/Regenerado"
      });
    } catch (mailError: unknown) {
      const message = mailError instanceof Error ? mailError.message : String(mailError);
      this.logger.error(`Error al enviar correo de nuevo PIN: ${message}`);
      // Lanza excepción porque el usuario se quedaría bloqueado sin saber el código nuevo
      throw new InternalServerErrorException('PIN guardado en el sistema, pero el proveedor SMTP falló.');
    }

    // 6. Devolvemos la respuesta que espera tu Frontend (React)
    return {
      message: 'Nuevo PIN generado con éxito, Enviado a correo electrónico correctamente',
      worker: `${worker.nombre} ${worker.apellidos || ''}`,
      pin: rawPin // 👈 Única vez que este dato existe en texto plano
    };
  }

async reasignarTrabajadoresMasivo(workerIds: number[], nuevoHorarioId: number) {
  if (!workerIds || workerIds.length === 0) {
    throw new BadRequestException('No se han seleccionado trabajadores para reasignar.');
  }

  // 🟢 Usamos el método nativo del repositorio pasándole el objeto directamente
  await this.workerRepository.update(
    workerIds, // Primer parámetro: IDs a actualizar
    { horarioId: nuevoHorarioId  as any} // Segundo parámetro: El campo físico con el nuevo valor
  );

  return {
    success: true,
    message: `${workerIds.length} trabajadores movidos al nuevo horario con éxito.`
  };
}

  /**
   * Lista todos los workers (Solo para Admin)
   */
  /**
   *  Lista todos los trabajadores del sistema. Este método está diseñado para ser utilizado por usuarios con rol de Admin, y devuelve una lista completa de trabajadores sin filtrar por empresa. La lógica de filtrado por empresa se maneja en el controlador, donde se verifica el rol del usuario autenticado y se llama a este método solo si el usuario es un SuperAdmin. Si el usuario es un Admin normal, se llama a otro método que filtra los trabajadores por la empresa del Admin. Este enfoque permite mantener la lógica de negocio centralizada en el servicio, mientras que el controlador se encarga de manejar la seguridad y las rutas específicas para cada tipo de usuario.
   * @returns Lista de todos los trabajadores del sistema. Si el usuario autenticado no tiene permisos para acceder a esta información, se lanzará una excepción que será manejada por el WorkerController.
   * Nota: Si en el futuro decides permitir que un Admin normal también pueda listar todos los trabajadores sin filtrar por empresa, puedes ajustar la lógica de seguridad en el controlador para llamar a este método independientemente del rol del usuario, o agregar una condición dentro de este método para verificar el rol y aplicar el filtro de empresa solo si el usuario es un Admin normal.      
  
   */
  /**
   * Lista todos los workers con paginación (Solo para SuperAdmin)
   */
  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await this.workerRepository.findAndCount({
      relations: ['empresa'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: skip,
    });

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }
  /**
   * Lista workers filtrando por empresa (Para Admin normal)
   * Este método se utiliza para listar los trabajadores asociados a la empresa del Admin normal. El controlador se encarga de verificar el rol del usuario autenticado y llamar a este método solo si el usuario es un Admin normal, pasando su empresaId como parámetro. Si el usuario es un SuperAdmin, se llama al método findAll() que devuelve todos los trabajadores sin filtrar por empresa. Este enfoque permite mantener la lógica de negocio centralizada en el servicio, mientras que el controlador se encarga de manejar la seguridad y las rutas específicas para cada tipo de usuario.
   * @param empresaId ID de la empresa para filtrar los trabajadores. Este valor se obtiene del usuario autenticado (Admin normal) y se pasa desde el controlador.
   * @return Lista de trabajadores asociados a la empresa especificada. Si el usuario autenticado no tiene permisos para acceder a esta información, se lanzará una excepción que será manejada por el WorkerController.
   * Nota: Si en el futuro decides permitir que un Admin normal también pueda listar todos los trabajadores sin filtrar por empresa, puedes ajustar la lógica de seguridad en el controlador para llamar al método findAll() independientemente del rol del usuario, o agregar una condición dentro de este método para verificar el rol y aplicar el filtro de empresa solo si el usuario es un Admin normal.
   */
  async findAllByEmpresa(empresaId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await this.workerRepository.findAndCount({
      where: { empresa: { id: empresaId } },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: skip,
    });

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
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
  // src/worker/worker.service.ts

async update(id: number, dto: UpdateWorkerDto, currentUser: UserPayload) {
  return await this.dataSource.transaction(async (manager) => {
    
    // 1. BUSCAR TRABAJADOR Y USUARIO
    const whereCondition: any = { id };
    if (currentUser.rol !== UserRole.SUPERADMIN) {
      if (!currentUser.empresaId) throw new ForbiddenException('No tienes empresa asignada');
      whereCondition.empresaId = currentUser.empresaId;
    }

    const worker = await manager.findOne(Worker, { where: whereCondition });
    const user = await manager.findOne(User, { where: { id } });

    if (!worker || !user) {
      throw new NotFoundException(`No se encontró el trabajador o el usuario con ID ${id}`);
    }

    // 2. VALIDACIÓN DE EMAIL DUPLICADO (Excluyendo al usuario actual)
    if (dto.email) {
      const emailDuplicado = await manager.findOne(User, {
        where: { email: dto.email.toLowerCase().trim(), id: Not(id) }
      });
      if (emailDuplicado) throw new BadRequestException('Este correo electrónico ya lo tiene otro trabajador.');
    }

    // 🚩 NUEVO: VALIDACIÓN DE DNI DUPLICADO (Excluyendo al usuario actual)
    if (dto.dni) {
      const cleanDni = dto.dni.toUpperCase().trim();
      const dniDuplicado = await manager.findOne(User, {
        where: { dni: cleanDni, id: Not(id) }
      });
      if (dniDuplicado) throw new BadRequestException(`El DNI [${cleanDni}] ya pertenece a otro trabajador.`);
    }

    // 3. ACTUALIZACIÓN SINCRONIZADA DE CAMPOS COMPARTIDOS
    const camposCompartidos = ['nombre', 'apellidos', 'email', 'telefono', 'dni'];
    camposCompartidos.forEach(campo => {
      if (dto[campo] !== undefined) {
        let valor = dto[campo];
        if (campo === 'email' && valor) valor = valor.toLowerCase().trim();
        if (campo === 'dni' && valor) valor = valor.toUpperCase().trim();
        
        worker[campo] = valor;
        user[campo] = valor;
      }
    });

    // 4. ACTUALIZACIÓN DE CAMPOS EXCLUSIVOS DE WORKER
    const camposWorker = ['categoria', 'fechaNacimiento', 'calle', 'poblacion', 'provincia', 'pais', 'diaPertenece'];
    camposWorker.forEach(campo => {
      if (dto[campo] !== undefined) {
        worker[campo] = (campo === 'fechaNacimiento' && dto[campo]) ? new Date(dto[campo]) : dto[campo];
      }
    });

    // 5. GESTIÓN DE HORARIO Y FECHA ANCLA (Evita el null)
    if (dto.horarioId !== undefined) {
      const nuevoId = dto.horarioId;
      worker.horarioId = nuevoId;
      user.horario = nuevoId ? { id: nuevoId } as any : null;

      if (nuevoId) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        user.fechaInicioHorario = hoy;
      } else {
        user.fechaInicioHorario = null;
      }
      worker.fechaInicioHorario = user.fechaInicioHorario; // Sincronización crucial
    }

    // 6. GUARDADO CON CATCH MEJORADO
    try {
      await manager.save(User, user);
      return await manager.save(Worker, worker);
    } catch (error: any) {
      // Si la base de datos detecta un duplicado que se nos escapó
      if (error.code === '23505') {
        const detalle = error.detail || '';
        const campoMatch = detalle.match(/\((.*?)\)/);
        const campo = campoMatch ? campoMatch[1] : 'desconocido';
        throw new BadRequestException(`Error de duplicidad: El valor para [${campo}] ya existe.`);
      }
      
      this.logger.error(`Error en transacción: ${error.message}`);
      throw new InternalServerErrorException('Error al sincronizar los datos en las tablas.');
    }
  });
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

      const fechaAncla = new Date();
        fechaAncla.setHours(0, 0, 0, 0);
      await this.dataSource.transaction(async (manager) => {

        // A) Actualizar WORKER
        // ALERTA: Tu entidad tiene 'horarioId'. Usar esto es lo más seguro.
        await manager.update(Worker, workerId, {
          horarioId: horarioId // Actualización directa a la columna física
          ,fechaInicioHorario: fechaAncla
        } as any);

        
        // B) Actualizar USER
        // Como Worker.id === User.id (Shared Primary Key), usamos el mismo 'workerId'.
        // Nota: Esto asume que la entidad User también tiene una relación con Horario.
        await manager.update(User, workerId, {
          // Si en User no tienes 'horarioId' columna, usa la relación:
          horario: { id: horarioId },
          fechaInicioHorario: fechaAncla
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


  async assignWorker(dto: AssignWorkerDto, admin: UserPayload) {
  // 1. Buscamos al trabajador validando su empresa y cargando sus obras actuales
  const worker = await this.workerRepository.findOne({
    where: { id: dto.workerId, empresaId: admin.empresaId },
    relations: ['sites'] // 🚩 Cargamos la relación plural
  });

  if (!worker) throw new NotFoundException('Trabajador no encontrado en tu empresa.');

  // 2. Buscamos todas las obras que vienen en el array de IDs
  // Solo buscamos las que pertenezcan a la empresa del admin y estén activas
  const sites = await this.siteRepository.find({
    where: { 
      id: In(dto.siteIds), // 🚩 Buscamos todos los IDs a la vez
      empresaId: admin.empresaId,
      isActive: true 
    }
  });

  // 3. Validamos si encontramos todas las obras solicitadas
  if (sites.length !== dto.siteIds.length) {
    throw new BadRequestException('Una o más obras no existen o no pertenecen a tu empresa.');
  }

  // 4. Asignamos el nuevo array de obras al trabajador
  worker.sites = sites;

  // 5. Guardamos el objeto Worker (TypeORM se encarga de la tabla intermedia)
  await this.workerRepository.save(worker);

  return {
    message: `Trabajador ${worker.nombre} asignado con éxito a ${sites.length} obras.`,
    workerId: worker.id,
    assignedSites: sites.map(s => s.name)
  };
}
}