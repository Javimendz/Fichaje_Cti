
// src/empresas/empresas.service.ts
// --- Servicio para la gestión de Empresas ---
// El servicio de Company se encarga de toda la lógica de negocio relacionada con las empresas, incluyendo la creación, actualización, eliminación y consulta de empresas. Además, maneja la lógica de seguridad relacionada con el acceso a las empresas según el rol del usuario (SuperAdmin, Admin). El servicio utiliza TypeORM para interactuar con la base de datos y gestiona transacciones para operaciones críticas como la creación de una empresa junto con su usuario Admin asociado. También incluye validaciones para evitar duplicados y garantizar la integridad de los datos.
import { Injectable, InternalServerErrorException, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Company } from './entities/company.entity';
import { User } from 'auth/entities/user.entity';
import { UserRole } from 'auth/roles.enum';
import { UserPayload } from 'auth/interfaces/user-payload.interface';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { SetupCompanyDto } from './dto/setup-company.dto';


// El servicio de Company se encarga de toda la lógica de negocio relacionada con las empresas, incluyendo la creación, actualización, eliminación y consulta de empresas. Además, maneja la lógica de seguridad relacionada con el acceso a las empresas según el rol del usuario (SuperAdmin, Admin). El servicio utiliza TypeORM para interactuar con la base de datos y gestiona transacciones para operaciones críticas como la creación de una empresa junto con su usuario Admin asociado. También incluye validaciones para evitar duplicados y garantizar la integridad de los datos.
// El servicio delega toda la lógica de validación y gestión de datos, manteniendo el controlador limpio y enfocado en manejar las solicitudes HTTP y la seguridad de acceso. Es fundamental para la estructura del sistema, ya que cada empresa puede tener múltiples usuarios asociados (Admins y Workers), y la gestión de estas empresas es una tarea crítica que debe ser controlada estrictamente, especialmente en lo que respecta a la creación, actualización y eliminación de empresas.
// El servicio incluye métodos para:
// - createWithAdmin: Crea una nueva empresa junto con un usuario Admin asociado en una transacción atómica.    
// - findAll: Lista las empresas a las que el usuario tiene acceso, con un log de auditoría para monitorear el acceso a información sensible.
// - findOne: Obtiene una empresa por su ID, validando que el usuario tenga acceso a ella.
// - update: Actualiza los datos de una empresa y su Admin asociado, con validaciones para evitar duplicados.
// - remove: Elimina una empresa, validando que exista antes de intentar eliminarla.
// - findByName: Método auxiliar para el Seed, que busca una empresa por su nombre.


// --- Servicio para la gestión de Empresas ---
/*
* CompanyService
* Gestiona toda la lógica de negocio relacionada con las empresas, incluyendo la creación, actualización, eliminación y consulta de empresas. Además, maneja la lógica de seguridad relacionada con el acceso a las empresas según el rol del usuario (SuperAdmin, Admin). El servicio utiliza TypeORM para interactuar con la base de datos y gestiona transacciones para operaciones críticas como la creación de una empresa junto con su usuario Admin asociado. También incluye validaciones para evitar duplicados y garantizar la integridad de los datos.
* El servicio delega toda la lógica de validación y gestión de datos, manteniendo el controlador limpio y enfocado en manejar las solicitudes HTTP y la seguridad de acceso. Es fundamental para la estructura del sistema, ya que cada empresa puede tener múltiples usuarios asociados (Admins y Workers), y la gestión de estas empresas es una tarea crítica que debe ser controlada estrictamente, especialmente en lo que respecta a la creación, actualización y eliminación de empresas.
* El servicio incluye métodos para:
* - createWithAdmin: Crea una nueva empresa junto con un usuario Admin asociado en una transacción atómica.
* - findAll: Lista las empresas a las que el usuario tiene acceso, con un log de auditoría para monitorear el acceso a información sensible.  
*/
@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name); // 💡 Inicializado correctamente
  constructor(
    @InjectRepository(Company)
    private readonly empresaRepository: Repository<Company>,
    private readonly dataSource: DataSource, // Inyectado para transacciones
  ) {}

  // 1. Método para crear una empresa junto con un usuario Admin
  // Este método es el único punto de entrada para crear una empresa, y solo puede ser accedido por un SuperAdmin. Se encarga de crear la empresa y el usuario Admin asociado en una transacción atómica, garantizando que ambos se creen correctamente o ninguno se cree en caso de error.
  // El método recibe un DTO que incluye los datos de la empresa y del Admin a crear. Primero valida que el CIF de la empresa no esté registrado,
  // luego inicia una transacción para crear la empresa y el Admin. Si ocurre algún error durante el proceso, se realiza un rollback de la transacción para mantener la integridad de los datos. Finalmente, devuelve un objeto con información sobre la empresa y el Admin creado.
  /**
   *  
   * @param dto DTO que incluye datos de la empresa y del Admin a crear 
   * @returns La empresa creada junto con el usuario Admin asociado
   * * Este endpoint es el único método para crear una empresa, y solo puede ser accedido por un SuperAdmin. Este método también se encarga de crear un usuario Admin asociado a la empresa, garantizando que cada empresa tenga al menos un Admin desde su creación.
   * 
   */
async createWithAdmin(dto: SetupCompanyDto) {
  const { admin: adminData } = dto;

  // 1. 🛡️ VALIDACIONES PREVIAS Y NORMALIZACIÓN (Fuera de la transacción)
  if (!dto.cif) throw new BadRequestException('El CIF de la empresa es obligatorio.');
  if (!dto.nombreEmpresa) throw new BadRequestException('El nombre de la empresa es obligatorio.');
  if (!adminData.email) throw new BadRequestException('El email del administrador es obligatorio.');
  if (!adminData.password) throw new BadRequestException('La contraseña del administrador es obligatoria.');
  if (!adminData.telefono) throw new BadRequestException('El teléfono del administrador es obligatorio.');

  // Normalización de datos para asegurar unicidad real (Case Insensitive)
  const cifLimpio = dto.cif.toUpperCase().trim();
  const nombreLimpio = dto.nombreEmpresa.toUpperCase().trim();
  const emailLimpio = adminData.email.toLowerCase().trim();
  const telLimpio = adminData.telefono.trim();

  // -- Validar duplicados de Empresa --
  // Al buscar y guardar siempre en Mayúsculas, garantizamos que el nombre sea único
  const nombreExiste = await this.empresaRepository.findOne({ where: { nombre: nombreLimpio } });
  if (nombreExiste) throw new BadRequestException(`La empresa con el nombre '${nombreLimpio}' ya existe.`);

  const cifExiste = await this.empresaRepository.findOne({ where: { cif: cifLimpio } });
  if (cifExiste) throw new BadRequestException(`El CIF '${cifLimpio}' ya está registrado por otra empresa.`);

  // -- Validar duplicados de Administrador --
  const userRepository = this.dataSource.getRepository(User);
  const adminConflicto = await userRepository.findOne({
    where: [{ email: emailLimpio }, { telefono: telLimpio }]
  });

  if (adminConflicto) {
    if (adminConflicto.email === emailLimpio) throw new BadRequestException('El correo electrónico del administrador ya está registrado.');
    if (adminConflicto.telefono === telLimpio) throw new BadRequestException('El teléfono del administrador ya está registrado.');
  }

  // 2. ⚡ PREPARACIÓN PESADA (Fuera de la transacción para no bloquear la DB)
  const hashedPassword = await bcrypt.hash(adminData.password, 10);

  // 3. 🚀 INICIO DE LA TRANSACCIÓN
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // A. Crear la Empresa
    const nuevaEmpresa = queryRunner.manager.create(Company, {
      nombre: nombreLimpio, // Se guarda en MAYÚSCULAS
      cif: cifLimpio,      // Se guarda en MAYÚSCULAS
      direccion: dto.direccion,
      poblacion: dto.poblacion,
      provincia: dto.provincia,
      pais: dto.pais,
      email: dto.email?.toLowerCase().trim(),
      latitud: dto.latitud,
      longitud: dto.longitud,
      contactoNombre: dto.nombreContacto,
      telefonoContacto: dto.telefonoContacto,
      telefonoEmpresa: dto.telefonoEmpresa,
      codigoPostal: dto.codigoPostal,
      isActive: true,
    });
    
    const empresaGuardada = await queryRunner.manager.save(nuevaEmpresa);

    // B. Crear el Administrador vinculado
    const nuevoAdmin = queryRunner.manager.create(User, {
      ...adminData,
      email: emailLimpio,
      password: hashedPassword,
      rol: UserRole.ADMIN,
      empresaId: empresaGuardada.id, // FK vinculada al ID recién creado
      isVerified: true,
      isActive: true,
    } as any);
    
    const adminGuardado = await queryRunner.manager.save(nuevoAdmin);

    // C. Confirmar cambios: Si llegamos aquí, Empresa y Admin se guardan juntos
    await queryRunner.commitTransaction();

    this.logger.log(`[SETUP] Empresa "${empresaGuardada.nombre}" creada con éxito.`);

    return {
      message: 'Alta de empresa y administrador completada con éxito',
      empresa: { 
        id: empresaGuardada.id, 
        nombre: empresaGuardada.nombre 
      },
      admin: { 
        id: adminGuardado.id, 
        email: adminGuardado.email,
        rol: adminGuardado.rol 
      }
    };

  } catch (error) {
    // 🔙 En caso de cualquier error, se deshace la creación de la empresa
    await queryRunner.rollbackTransaction();
    this.logger.error(`Fallo en el alta de empresa: ${error.message}`, error.stack);
    
    throw new InternalServerErrorException('No se pudo procesar el registro. Inténtelo de nuevo.');
  } finally {
    // 🔌 Liberar la conexión para mantener la salud del pool
    await queryRunner.release();
  }
}
// 2. Método para listar empresas con log de auditoría
// Este método permite a los SuperAdmin listar todas las empresas, mientras que los Admin solo pueden ver la empresa a la que pertenecen. El método incluye un log de auditoría que registra el email, ID y rol del usuario que solicita el listado de empresas, lo cual es útil para monitorear el acceso a información sensible y detectar posibles actividades no autorizadas. La lógica de filtrado y validación se delega al CompanyService, manteniendo el controlador limpio.
// El método utiliza un QueryBuilder para construir la consulta de manera flexible, permitiendo incluir condiciones dinámicas según el rol del usuario. Además, se maneja la respuesta de manera profesional, formateando los datos antes de devolverlos al controlador.
/**
 * 
 * *@param user Usuario autenticado que realiza la solicitud. Se utiliza para validar el acceso a las empresas y para registrar un log de auditoría con su email, ID y rol.
 * *@returns Lista de empresas a las que el usuario tiene acceso (todas para SuperAdmin, solo la suya para Admin).
 * Este endpoint permite a los SuperAdmin listar todas las empresas, mientras que los Admin solo pueden ver la empresa a la que pertenecen. El método delega la lógica de filtrado y validación al CompanyService, manteniendo el controlador limpio.
 */
async findAll(user: UserPayload) {
    const query = this.empresaRepository.createQueryBuilder('empresa')
      .leftJoinAndSelect(
        'empresa.usuarios', 
        'admin', 
        'admin.rol = :rol AND admin.isActive = :isActive', 
        { rol: UserRole.ADMIN, isActive: true }
      );

    // 🛡️ FILTRO DE SEGURIDAD ESTRICTO
    if (user.rol !== UserRole.SUPERADMIN) {
      if (!user.empresaId) {
        this.logger.error(`Acceso denegado: Usuario ${user.email} sin empresaId`);
        throw new ForbiddenException('No tienes una empresa asignada');
      }
      // Forzamos que la consulta solo devuelva SU empresa
      query.where('empresa.id = :id', { id: user.empresaId });
    }

    try {
      const empresas = await query.getMany();
      return empresas.map(empresa => this.formatResponse(empresa));
    } catch (error) {
      throw new InternalServerErrorException('Error al recuperar las empresas');
    }
  }

// 3. Método para obtener una empresa por ID con validación de acceso
// Este método permite obtener una empresa por su ID, pero solo si el usuario tiene acceso a ella (SuperAdmin puede acceder a cualquier empresa, Admin solo a la suya). La lógica de validación y obtención de la empresa se delega al CompanyService, manteniendo el controlador enfocado en manejar la solicitud HTTP y la seguridad de acceso. El método utiliza un QueryBuilder para incluir la relación con los usuarios Admin de manera eficiente, y maneja las excepciones de manera profesional para proporcionar mensajes claros en caso de errores.
// El método también formatea la respuesta para incluir solo la información relevante de la empresa y su Admin asociado, manteniendo una estructura de datos limpia y profesional.
/**
 * 
 *  * @param id ID de la empresa a obtener. Se valida que sea un número entero mediante ParseIntPipe.
 *  * @param user Usuario autenticado que realiza la solicitud. Se utiliza para validar que el usuario tiene acceso a la empresa solicitada.
 *  * @returns La empresa solicitada. Si la empresa no existe o el usuario no tiene acceso, se lanzará una excepción que será manejada por el CompanyService.  
  * * Este endpoint es accesible solo para SuperAdmin, ya que la gestión de empresas es una tarea crítica que debe ser controlada estrictamente. El método delega toda la lógica de validación y obtención de la empresa al CompanyService, manteniendo el controlador enfocado en manejar la solicitud HTTP y la seguridad de acceso.
 */

async findOne(id: number, user: UserPayload) {
    // 🛡️ Si no es SuperAdmin, el ID solicitado DEBE ser el suyo
    if (user.rol !== UserRole.SUPERADMIN && Number(user.empresaId) !== Number(id)) {
      this.logger.warn(`Intento de brecha: User ${user.id} intentó acceder a empresa ${id}`);
      throw new ForbiddenException('No tienes permiso para ver esta empresa');
    }

    const empresa = await this.empresaRepository.createQueryBuilder('empresa')
      .leftJoinAndSelect('empresa.usuarios', 'usuario', 'usuario.rol = :rol', { rol: UserRole.ADMIN })
      .where('empresa.id = :id', { id })
      .getOne();

    if (!empresa) throw new NotFoundException('Empresa no encontrada');
    return this.formatResponse(empresa);
  }
  // 4. Método para actualizar una empresa y su Admin asociado
  // Este método permite actualizar los datos de una empresa y su Admin asociado. Solo puede ser accedido por un SuperAdmin, ya que la gestión de empresas es una tarea crítica que debe ser controlada estrictamente. El método delega toda la lógica de validación y actualización al CompanyService, manteniendo el controlador enfocado en manejar la solicitud HTTP y la seguridad de acceso. El método incluye validaciones para evitar duplicados de nombre y CIF, y maneja la actualización del Admin asociado, incluyendo la validación de email y encriptación de contraseña si se proporciona.
  /**
   * 
   * * @param id ID de la empresa a actualizar. Se valida que sea un número entero mediante ParseIntPipe. 
   * * @param dto DTO con los datos a actualizar de la empresa. Puede incluir campos de la empresa y del Admin asociado. 
   * * @returns La empresa actualizada. Si la empresa no existe o no se puede actualizar, se lanzará una excepción que será manejada por el CompanyService. 
   * * Este endpoint es accesible solo para SuperAdmin, ya que la gestión de empresas es una tarea crítica que debe ser controlada estrictamente. El método delega toda la lógica de validación y actualización al CompanyService, manteniendo el controlador enfocado en manejar la solicitud HTTP y la seguridad de acceso.
   */
 async update(id: number, dto: UpdateCompanyDto, user: UserPayload) {
  const { admin, ...empresaDatos } = dto as any;

  if (user.rol !== UserRole.SUPERADMIN) {
        throw new ForbiddenException('Solo el SuperAdministrador puede modificar empresas');
    }
  
  if (empresaDatos.nombre) {
    const nombreNormalizado = empresaDatos.nombre.toUpperCase().trim();
    const empresaExistente = await this.empresaRepository.findOne({
      where: { nombre: nombreNormalizado }
    });
    // Si existe con ese nombre pero tiene un ID distinto al que editamos, es duplicado
    if (empresaExistente && empresaExistente.id !== id) {
      throw new BadRequestException(`Ya existe otra empresa registrada con el nombre: ${empresaDatos.nombre}`);
    }
    empresaDatos.nombre = nombreNormalizado;
  }

  if (empresaDatos.cif) {
    const cifNormalizado = empresaDatos.cif.toUpperCase().trim();
    const cifExistente = await this.empresaRepository.findOne({
      where: { cif: cifNormalizado }
    });
    if (cifExistente && cifExistente.id !== id) {
      throw new BadRequestException(`El CIF ${empresaDatos.cif} ya pertenece a otra empresa.`);
    }
    empresaDatos.cif = cifNormalizado;
  }

  // ---  PRELOAD DE LA EMPRESA ---
  const empresa = await this.empresaRepository.preload({ id, ...empresaDatos });
  if (!empresa) throw new NotFoundException(`Empresa con ID ${id} no existe`);

  // ---  ACTUALIZACIÓN DEL ADMINISTRADOR (USER) ---
  if (admin) {
    const adminUpdateData = { ...admin };

    // Validar si el email ya existe en OTRO usuario
    if (adminUpdateData.email) {
      const emailLimpio = adminUpdateData.email.toLowerCase().trim();
      const emailExists = await this.dataSource.getRepository(User).findOne({
        where: { email: emailLimpio }
      });

      // Si el email existe y el dueño no es el admin de esta empresa
      if (emailExists && emailExists.empresaId !== id) {
        throw new BadRequestException(`El email ${adminUpdateData.email} ya está registrado por otro usuario.`);
      }
      adminUpdateData.email = emailLimpio;
    }

    // Encriptar password si viene
    if (adminUpdateData.password) {
      adminUpdateData.password = await bcrypt.hash(adminUpdateData.password, 10);
    }

    try {
      // Actualizamos al usuario que sea ADMIN y pertenezca a esta empresa
      await this.dataSource
        .createQueryBuilder()
        .update(User)
        .set(adminUpdateData)
        .where('empresaId = :id', { id })
        .andWhere('rol = :rol', { rol: UserRole.ADMIN })
        .execute();
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('El email o teléfono del administrador ya están en uso por otro usuario.');
      }
      throw new InternalServerErrorException('Error al actualizar los datos del administrador');
    }
  }

  // ---  GUARDADO FINAL Y RETORNO ---
  try {
    await this.empresaRepository.save(empresa);
    // Devolvemos la empresa actualizada usando el findOne existente
    return this.findOne(id, { rol: UserRole.SUPERADMIN } as any);
  } catch (error) {
    if (error.code === '23505') {
      throw new BadRequestException('Error de duplicidad: el nombre o CIF de la empresa ya existen.');
    }
    throw new InternalServerErrorException('Error inesperado al guardar los cambios de la empresa');
  }
}

 private formatResponse(empresa: Company) {
  const { usuarios, ...resto } = empresa;

  // Extraemos el primer usuario (que es el Admin)
  const adminRaw = (usuarios && usuarios.length > 0) ? usuarios[0] : null;

  // Creamos un objeto limpio con solo los campos públicos
  const adminSafe = adminRaw ? {
    id: adminRaw.id,
    nombre: adminRaw.nombre,
    apellidos: adminRaw.apellidos,
    email: adminRaw.email,
    rol: adminRaw.rol,
    telefono: adminRaw.telefono,
    isActive: adminRaw.isActive,
  } : null;

  return {
    ...resto,
    admin: adminSafe
  };
}
  // 5. Método para eliminar una empresa
  // Este método se encarga de eliminar una empresa, pero primero valida que la empresa exista. La eliminación de una empresa es una acción crítica que puede afectar a muchos usuarios y datos asociados, por lo que solo debe ser realizada por un SuperAdmin. La lógica de eliminación, incluyendo la validación de que la empresa existe y la gestión de las relaciones (como usuarios asociados), se delega al CompanyService para mantener el controlador limpio. El método utiliza el repositorio para eliminar la empresa, lo que también eliminará en cascada a los usuarios asociados debido a la configuración de la entidad.
/**
 * 
 * * @param id ID de la empresa a eliminar. Se valida que sea un número entero mediante ParseIntPipe.
 * * @returns Resultado de la operación de eliminación. Si la empresa no existe o no se puede eliminar, se lanzará una excepción que será manejada por el CompanyService.
 *   
 * */

  async remove(id: number) {
  const empresa = await this.empresaRepository.findOneBy({ id });
  if (!empresa) throw new NotFoundException('Empresa no encontrada');
  
  // Esto elimina la empresa y, por la cascada, a todos sus usuarios y horarios
  return await this.empresaRepository.remove(empresa);

}

  // 
  // Auxiliar para el Seed
  /**
   * Método auxiliar para el Seed, que busca una empresa por su nombre. Este método es útil para evitar la creación de empresas duplicadas durante el proceso de seeding, permitiendo verificar si una empresa con el mismo nombre ya existe antes de intentar crearla. El método utiliza el repositorio de TypeORM para realizar la consulta y devuelve la empresa encontrada o null si no existe.
   * * @param nombre Nombre de la empresa a buscar. Se normaliza a mayúsculas y se recortan espacios para evitar problemas de formato.
   * * @returns La empresa encontrada con el nombre especificado, o null si no existe.
   */ 
  async findByName(nombre: string) {
    return await this.empresaRepository.findOneBy({ nombre });
  }
}