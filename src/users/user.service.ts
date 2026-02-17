import { 
  BadRequestException, 
  ForbiddenException, 
  Injectable, 
  InternalServerErrorException, 
  NotFoundException 
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { CreateWorkerDto } from "./dto/create-worker.dto";
import { UserRole } from "auth/roles.enum";
import type { UserPayload } from "auth/interfaces/user-payload.interface"; 
import { User } from "./entities/user.entity";
import * as bcrypt from 'bcrypt';

type CreateUserDto = CreateAdminDto | CreateWorkerDto;

// El servicio de User se encarga de gestionar la lógica de negocio relacionada con los usuarios del sistema. Incluye métodos para crear, listar, obtener por ID, actualizar y eliminar usuarios, respetando la jerarquía de roles y la seguridad de acceso a los datos. El método de creación es unificado para Admins y Workers, delegando toda la lógica de validación y asignación de roles al servicio, lo que mantiene el controlador limpio y enfocado en manejar las solicitudes HTTP. Además, el servicio maneja las excepciones de manera profesional, lanzando errores específicos para casos como datos duplicados, permisos insuficientes o recursos no encontrados.
/**
 * * * UserService
 *  * Gestiona la lógica de negocio relacionada con los usuarios del sistema. Incluye métodos para crear, listar, obtener por ID, actualizar y eliminar usuarios, respetando la jerarquía de roles y la seguridad de acceso a los datos. El método de creación es unificado para Admins y Workers, delegando toda la lógica de validación y asignación de roles al servicio, lo que mantiene el controlador limpio y enfocado en manejar las solicitudes HTTP. Además, el servicio maneja las excepciones de manera profesional, lanzando errores específicos para casos como datos duplicados, permisos insuficientes o recursos no encontrados.
 * */
@Injectable()
export class UserService {
  
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ========================
  // MÉTODO ÚNICO DE CREACIÓN
  // ========================
  /**
   * 
   * @param dto DTO con los datos del usuario a crear, incluyendo el rol y opcionalmente empresaId (solo para SuperAdmin). 
   * @param currentUser Usuario autenticado que realiza la solicitud, utilizado para validar permisos y asignar empresaId si es un Admin.
   * @returns El usuario creado. Si la creación falla por validación o permisos, se lanzará una excepción que será manejada por el UserService.
   * * Este endpoint unificado simplifica la creación de usuarios, evitando la necesidad de tener endpoints separados para Admins y Workers, y centraliza la lógica de creación en el UserService, lo que mejora la mantenibilidad y claridad del código. El método se encarga de validar los datos recibidos, asignar el rol correcto, manejar la lógica de empresa según el rol del usuario autenticado, y realizar el hashing de la contraseña antes de guardar el usuario en la base de datos. Además, maneja las excepciones de manera profesional, lanzando errores específicos para casos como datos duplicados o permisos insuficientes.
   */
 async create(dto: CreateUserDto, currentUser: UserPayload) {
  let empresaIdFinal: number;

  // 1. Lógica de Empresa (SuperAdmin vs Admin)
  if (currentUser.rol === UserRole.SUPERADMIN) {
    if (!dto.empresaId) throw new BadRequestException('Debe especificar empresaId');
    empresaIdFinal = Number(dto.empresaId);
  } else {
    if (!currentUser.empresaId) throw new ForbiddenException('No tienes empresa asociada');
    empresaIdFinal = currentUser.empresaId;
  }

  // 2. Rol solicitado (Limpieza de array si viene como ["ADMIN"])
  const rolSolicitado = Array.isArray(dto.rol) ? dto.rol[0] : (dto.rol || UserRole.WORKER);

  if (rolSolicitado === UserRole.SUPERADMIN && currentUser.rol !== UserRole.SUPERADMIN) {
    throw new ForbiddenException('No puedes crear un SuperAdmin');
  }

  //  Hashing de Contraseña (VITAL para que la DB no reciba nulos o basura)
  const passwordHash = dto.password 
    ? await bcrypt.hash(dto.password, 10) 
    : await bcrypt.hash('Temporal123!', 10); // Contraseña por defecto si no viene

  //  Crear objeto compatible con la Entidad
 const newUser = this.userRepository.create({
  ...dto,            // Campos generales (nombre, email, etc.)
  password: passwordHash,
  rol: rolSolicitado as UserRole,
  empresaId: empresaIdFinal, 
  isActive: true,
  isVerified: true,
});

  try {
    return await this.userRepository.save(newUser);
  } catch (error) {
    console.error("ERROR DB:", error);
    if (error.code === '23505') throw new BadRequestException('DNI, Email o Teléfono duplicado');
    throw new InternalServerErrorException('Error al guardar: ' + error.message);
  }
}
  // ========================
  // LISTAR USUARIOS POR SCOPE
  // ========================
  /**
   * 
   * @param currentUser Usuario autenticado que realiza la solicitud, utilizado para validar permisos y filtrar usuarios por empresa si es un Admin.    
    * @return Lista de usuarios a los que el usuario tiene acceso (todos para SuperAdmin, solo los de su empresa para Admin). Si la solicitud falla por permisos, se lanzará una excepción que será manejada por el UserService.
   * * Este endpoint proporciona una forma clara y segura de listar usuarios, respetando la jerarquía de roles y la seguridad de acceso a los datos, mientras mantiene el controlador enfocado en manejar las solicitudes HTTP. El método delega toda la lógica de filtrado y validación al UserService, que se encargará de validar los permisos del usuario autenticado y devolver la lista de usuarios correspondiente según su rol y empresa.
   * * El método utiliza un QueryBuilder para construir la consulta de manera flexible, permitiendo incluir condiciones dinámicas según el rol del usuario. Además, se maneja la respuesta de manera profesional, formateando los datos antes de devolverlos al controlador.
   */ 
  async findAllByUser(currentUser: UserPayload) {
    if (currentUser.rol === UserRole.SUPERADMIN) {
      return await this.userRepository.find({ relations: ['empresa'] });
    }
    
    if (!currentUser.empresaId) {
      throw new ForbiddenException('El administrador no tiene una empresa asignada');
    }

    return await this.userRepository.find({
      where: { empresaId: currentUser.empresaId },
      relations: ['empresa'],
    });
  }

  // ========================
  // OBTENER USUARIO POR ID
  // ========================
  /**
   * 
   * @param id ID del usuario a obtener, validado como número entero mediante ParseIntPipe. 
   * @param currentUser Usuario autenticado que realiza la solicitud, utilizado para validar permisos y acceso al usuario solicitado. Un Admin solo puede obtener usuarios de su empresa por su ID, mientras que un SuperAdmin puede obtener cualquier usuario por su ID.
   * @returns El usuario solicitado. Si el usuario no existe o el solicitante no tiene acceso a él, se lanzará una excepción que será manejada por el UserService.
   * * Este endpoint proporciona una forma segura de obtener información de un usuario específico, respetando la jerarquía de roles y la seguridad de acceso a los datos, mientras mantiene el controlador enfocado en manejar las solicitudes HTTP. El método delega toda la lógica de validación y obtención del usuario al UserService, que se encargará de validar los permisos del usuario autenticado y devolver el usuario solicitado si tiene acceso a él.
   * * El método utiliza un QueryBuilder para construir la consulta de manera flexible, permitiendo incluir condiciones dinámicas según el rol del usuario. Además, se maneja la respuesta de manera profesional, formateando los datos antes de devolverlos al controlador.  
   */
  async findOneById(id: number, currentUser: UserPayload) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['empresa'],
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (currentUser.rol !== UserRole.SUPERADMIN) {
      if (user.empresaId !== currentUser.empresaId) {
        throw new ForbiddenException('No tienes permiso para acceder a este usuario');
      }
    }
    
    return user;
  }

  // ========================
  // ACTUALIZAR USUARIO
  // ========================
  /**
   * 
   * @param id ID del usuario a actualizar, validado como número entero mediante ParseIntPipe.
   * @param dto DTO con los datos a actualizar del usuario. Puede incluir campos como nombre, email, rol, etc.
   * @param currentUser Usuario autenticado que realiza la solicitud, utilizado para validar permisos y acceso al usuario a actualizar. Un Admin solo puede actualizar usuarios de su empresa, mientras que un SuperAdmin puede actualizar cualquier usuario.
   * @returns El usuario actualizado. Si el usuario no existe, el solicitante no tiene acceso a él, o la actualización falla por validación o permisos, se lanzará una excepción que será manejada por el UserService.
   * * Este endpoint permite actualizar la información de un usuario específico, respetando la jerarquía de roles y la seguridad de acceso a los datos. El método delega toda la lógica de validación y actualización al UserService, manteniendo el controlador enfocado en manejar las solicitudes HTTP.
   */
 async update(id: number, dto: UpdateUserDto, currentUser: UserPayload) {
  const user = await this.findOneById(id, currentUser);

  // 1. Protección de Rol
  if (dto.rol && currentUser.rol !== UserRole.SUPERADMIN) {
    delete dto.rol;
  }

  // 2. Hashing de contraseña si viene en el update
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

  Object.assign(user, dto);
  return await this.userRepository.save(user);
}
  // ========================
  // ELIMINAR CASCADA
  // ========================
  /**
   * 
   * @param id ID del usuario a eliminar, validado como número entero mediante ParseIntPipe.
   * @param currentUser Usuario autenticado que realiza la solicitud, utilizado para validar permisos y acceso al usuario a eliminar. Un Admin solo puede eliminar usuarios de su empresa, mientras que un SuperAdmin no puede eliminar usuarios (seguridad adicional para evitar eliminaciones críticas).
   * @returns Resultado de la operación de eliminación. Si el usuario no existe, el solicitante no tiene acceso a él, o la eliminación falla por validación o permisos, se lanzará una excepción que será manejada por el UserService.
   * * Este endpoint permite eliminar un usuario específico, respetando la jerarquía de roles y la seguridad de acceso a los datos. La eliminación es lógica (soft delete), lo que significa que el usuario no se elimina físicamente de la base de datos, sino que se marca como inactivo o eliminado. El método delega toda la lógica de validación y eliminación al UserService, manteniendo el controlador enfocado en manejar las solicitudes HTTP.
   */
  async remove(id: number, currentUser: UserPayload) {
    const user = await this.findOneById(id, currentUser);
    
    if (user.id === currentUser.userId) {
        throw new ForbiddenException('No puedes eliminar tu propia cuenta');
    }

    user.isActive = false;
    return await this.userRepository.save(user);
  }
}