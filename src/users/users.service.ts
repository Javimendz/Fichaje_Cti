import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { UserRole } from "auth/roles.enum";
import { Empresa } from "empresas/entities/empresa.entity";
import { CreateWorkerDto } from "./dto/create-worker.dto";
import type { UserPayload } from "auth/interfaces/user-payload.interface"; 
import { User } from "./entities/user.entity";

/**
 * UsersService
 * 
 * Servicio encargado de gestionar las operaciones CRUD relacionadas con los usuarios.
 * Proporciona métodos para crear, leer, actualizar y eliminar usuarios,
 * así como para listar usuarios según el rol y permisos del usuario actual.
 * 
 * Métodos principales: 
 * - createAdmin: Crea un usuario con rol de administrador (SUPERADMIN).
 * - createWorker: Crea un usuario con rol de trabajador (ADMIN).
 * - findAllByUser: Lista usuarios según el rol del usuario actual.
 * - findOneById: Obtiene un usuario por su ID con validación de permisos.
 * - update: Actualiza la información de un usuario con validación de permisos.
 * - remove: Realiza un borrado lógico de un usuario, desactivando su cuenta. 
 * @see https://docs.nestjs.com/providers
 */ 
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ========================
  // CREAR ADMIN (SUPERADMIN)
  // ========================
  /**
   * Crea un usuario con rol de ADMIN asociado a una empresa específica.
   * @param dto - Datos necesarios para crear el usuario administrador.
   * @param empresa - La empresa a la que se asociará el nuevo administrador.
   * @returns El usuario administrador creado.  
   * @throws ForbiddenException si el usuario actual no tiene permisos para crear un administrador.
   * @see CreateAdminDto
   * @see Empresa
   * @see UserRole
   * @see User
   * 
   */
  
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
  /**
   *  Crea un usuario con rol de WORKER asociado a una empresa específica.
   *  @param dto - Datos necesarios para crear el usuario trabajador.
   *  @param empresa - La empresa a la que se asociará el nuevo trabajador.
   *  @returns El usuario trabajador creado.
   * @see CreateWorkerDto
   * @see Empresa
   * @see UserRole
   * @see User
   * @param dto 
   * @param empresa 
   * @returns 
   */
  /*
  async createWorker(dto: CreateWorkerDto, empresa: Empresa) {
    const expiraEn = new Date(); // Fecha actual
    expiraEn.setMinutes(expiraEn.getMinutes() + 5); // +5 minutos

    const user = this.userRepository.create({ // Propiedades comunes 

      ...dto, // dni, nombre, telefono vienen aquí
      rol: UserRole.WORKER,
      empresa,
      isVerified: false,
      isActive: true,
    });

    return await this.userRepository.save(user); // Guarda en la base de datos
  }
*/
  // ========================
  // LISTAR USUARIOS POR SCOPE
  // ========================
  /**
   *  Lista usuarios según el rol del usuario actual.
   *  - SUPERADMIN: Ve todos los usuarios.
   *  - ADMIN: Ve solo los usuarios de su empresa.
   * @param currentUser - Información del usuario actual obtenida del token JWT.
   * @returns Lista de usuarios accesibles para el usuario actual.
   * @see UserPayload
   * @see UserRole
   * @see User
   * @throws ForbiddenException si un ADMIN no tiene una empresa asignada.
   * 
   */
  async findAllByUser(currentUser: UserPayload) { // Listar usuarios según rol
    // 1. SUPERADMIN ve todo
    if (currentUser.rol === UserRole.SUPERADMIN) { // Sin restricciones
      return await this.userRepository.find({ // Todas las relaciones necesarias
        relations: ['empresa'], // Cargar la relación con empresa
      });
    }
    
    // 2. ADMIN ve solo su empresa
    if (!currentUser.empresaId) { // Validación extra
        throw new ForbiddenException('El administrador no tiene una empresa asignada'); // Seguridad
    }

    return await this.userRepository.find({ // Filtrado por empresa
      where: { empresa: { id: currentUser.empresaId } }, // Solo su empresa
      relations: ['empresa'], // Cargar la relación con empresa
    });
  }

  // ========================
  // OBTENER USUARIO POR ID
  // ========================
  /**
   *  Obtiene un usuario por su ID con validación de permisos basada en el rol del usuario actual.
   *  - SUPERADMIN: Puede acceder a cualquier usuario.
   *  - ADMIN: Solo puede acceder a usuarios de su propia empresa.  
   * @param id 
   * @param currentUser 
   * @returns 
   *  
   *  
   */
  async findOneById(id: string, currentUser: UserPayload) { // Buscar usuario por ID
    const user = await this.userRepository.findOne({ // Buscar por ID
      where: { id }, // Condición
      relations: ['empresa'], // Cargar relación con empresa
    });

    if (!user) throw new NotFoundException('Usuario no encontrado'); // Validación existencia

    // Validación de Scope usando el Payload
    if (currentUser.rol !== UserRole.SUPERADMIN) { // No es Superadmin
      if (user.empresa?.id !== currentUser.empresaId) { // Comparar empresas
        throw new ForbiddenException('No tienes permiso para acceder a este usuario'); // Denegar acceso
      }
    }
    
    return user; // Retornar usuario encontrado
  }

  // ========================
  // ACTUALIZAR USUARIO
  // ========================
  /**
   *  Actualiza la información de un usuario con validación de permisos.
   *  - SUPERADMIN: Puede actualizar cualquier usuario. 
   * - ADMIN: Solo puede actualizar usuarios de su propia empresa y no puede promoverse a SUPERADMIN.
   * @param id
   * @param dto
   * @param currentUser
   * @return Usuario actualizado.
   * @throws NotFoundException si el usuario no existe.
   * @throws ForbiddenException si el usuario actual no tiene permisos para actualizar el usuario especificado.
   * 
   */
  async update(id: string, dto: UpdateUserDto, currentUser: UserPayload) { // Actualizar usuario
    const user = await this.findOneById(id, currentUser); // Reutilizar método con validación

    // Protección extra: Un Admin no puede promoverse a Superadmin
    if (dto.rol && currentUser.rol !== UserRole.SUPERADMIN) { // No es Superadmin
        delete dto.rol;  // Eliminar cambio de rol
    }

    Object.assign(user, dto); // Mezclar cambios
    return await this.userRepository.save(user); // Guardar en BD
  }

  // ========================
  // ELIMINAR (SOFT DELETE)
  // ========================
  /**
   *  Realiza un borrado lógico de un usuario, desactivando su cuenta.
   *  también incluye validación de permisos.
   *  - SUPERADMIN: Puede eliminar cualquier usuario.
   *  - ADMIN: Solo puede eliminar usuarios de su propia empresa y no puede eliminarse a sí mismo.  
   * @param id 
   * @param currentUser 
   * @returns 
   */
  async remove(id: string, currentUser: UserPayload) { // Borrado lógico
    const user = await this.findOneById(id, currentUser); // Reutilizar método con validación
    
    // Evitar que el Admin se borre a sí mismo accidentalmente
    if (user.id === currentUser.userId) { // Mismo usuario
        throw new ForbiddenException('No puedes eliminar tu propia cuenta'); // Denegar acción
    }

    user.isActive = false; // Cambiar estado a inactivo
    return await this.userRepository.save(user); // Guardar en BD
  }
}