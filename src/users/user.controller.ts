import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateAdminDto } from './dto/create-admin.dto';

// Auth & Security
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';
import { RolesGuard } from 'auth/guards/roles.guard';
import { Roles } from 'auth/decorators/roles.decorator';
import { UserRole } from 'auth/roles.enum';
import { GetUser } from 'auth/decorators/get-user.decorator';
import type { UserPayload } from 'auth/interfaces/user-payload.interface';
import { Put } from '@nestjs/common';

/**
 * UsersController
 * * Gestiona el ciclo de vida de los usuarios. La seguridad de "empresaId" y 
 * * jerarquía de roles se delega al UsersService para mantener el controlador limpio.
 */
@UseInterceptors(ClassSerializerInterceptor) 
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor(
    private readonly usersService: UserService,
  ) {}

  // ==========================================
  // CREAR USUARIO (UNIFICADO)
  // ==========================================
  /**
   * Endpoint único para crear usuarios (Admins o Workers).
   * - Si eres SUPERADMIN: Debes enviar empresaId en el body.
   * - Si eres ADMIN: El sistema ignorará cualquier empresaId enviado y usará la tuya.
   *  * El método delega toda la lógica de validación y creación al UserService, manteniendo el controlador limpio y enfocado en manejar la solicitud HTTP y la seguridad de acceso. El UserService se encargará de validar los datos, asignar el rol correcto, y garantizar que un Admin solo pueda crear usuarios dentro de su propia empresa.
   * 
   * @param dto DTO con los datos del usuario a crear, incluyendo el rol y opcionalmente empresaId (solo para SuperAdmin).
   * @param currentUser Usuario autenticado que realiza la solicitud, utilizado para validar permisos y asignar empresaId si es un Admin.
   * @returns El usuario creado. Si la creación falla por validación o permisos, se lanzará una excepción que será manejada por el UserService.
   * * Este endpoint unificado simplifica la creación de usuarios, evitando la necesidad de tener endpoints separados para Admins y Workers, y centraliza la lógica de creación en el UserService, lo que mejora la mantenibilidad y claridad del código.
   */
  @Post('crear-user')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async create(
    @Body() dto: CreateAdminDto, 
    @GetUser() currentUser: UserPayload,
  ) {
    return this.usersService.create(dto, currentUser);
  }


  // ========================
  // LISTAR USUARIOS
  // ========================
  /**
   * Endpoint para listar usuarios.
   * - Si eres SUPERADMIN: Verás todos los usuarios de todas las empresas.
   * - Si eres ADMIN: Solo verás los usuarios de tu empresa.
   * * El método delega toda la lógica de filtrado y validación al UserService, manteniendo el controlador limpio. El UserService se encargará de validar los permisos del usuario autenticado y devolver la lista de usuarios correspondiente según su rol y empresa.
   * @param currentUser Usuario autenticado que realiza la solicitud, utilizado para validar permisos y filtrar usuarios por empresa si es un Admin.    
   * @return Lista de usuarios a los que el usuario tiene acceso (todos para SuperAdmin, solo los de su empresa para Admin). Si la solicitud falla por permisos, se lanzará una excepción que será manejada por el UserService.
   * * Este endpoint proporciona una forma clara y segura de listar usuarios, respetando la jerarquía de roles y la seguridad de acceso a los datos, mientras mantiene el controlador enfocado en manejar las solicitudes HTTP.
   */
  @Get('list-users')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async findAll(@GetUser() currentUser: UserPayload) {
    return this.usersService.findAllByUser(currentUser);
  }

  // ========================
  // OBTENER USUARIO POR ID
  // ========================
  /**
   * Endpoint para obtener un usuario por su ID.
   * - Si eres SUPERADMIN: Puedes obtener cualquier usuario por su ID.
   * - Si eres ADMIN: Solo puedes obtener usuarios de tu empresa por su ID.
   * * El método delega toda la lógica de validación y obtención del usuario al UserService, manteniendo el controlador limpio. El UserService se encargará de validar los permisos del usuario autenticado y devolver el usuario solicitado si tiene acceso a él.
   * @param id ID del usuario a obtener, validado como número entero mediante ParseIntPipe.
   * @param currentUser Usuario autenticado que realiza la solicitud, utilizado para validar permisos y acceso al usuario solicitado.
   * @return El usuario solicitado. Si el usuario no existe o el solicitante no tiene acceso a él, se lanzará una excepción que será manejada por el UserService.
   * * Este endpoint proporciona una forma segura de obtener información de un usuario específico, respetando la jerarquía de roles y la seguridad de acceso a los datos, mientras mantiene el controlador enfocado en manejar las solicitudes HTTP.
   * 
   */
  @Get('find/:id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN) //SuperAdmin no puede listar trabajadores
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() currentUser: UserPayload,
  ) {
    return this.usersService.findOneById(id, currentUser);
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
  @Put('update/:id')
  @Roles(UserRole.ADMIN) //SUper admin no puede actualizar trabajador cambiarlo
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @GetUser() currentUser: UserPayload,
  ) {
    return this.usersService.update(id, dto, currentUser);
  }

  // ========================
  // ELIMINAR (BORRADO LÓGICO)
  // ========================
  /**
   * 
   * @param id ID del usuario a eliminar, validado como número entero mediante ParseIntPipe.
   * @param currentUser Usuario autenticado que realiza la solicitud, utilizado para validar permisos y acceso al usuario a eliminar. Un Admin solo puede eliminar usuarios de su empresa, mientras que un SuperAdmin no puede eliminar usuarios (seguridad adicional para evitar eliminaciones críticas).
   * @returns Resultado de la operación de eliminación. Si el usuario no existe, el solicitante no tiene acceso a él, o la eliminación falla por validación o permisos, se lanzará una excepción que será manejada por el UserService.
   * * Este endpoint permite eliminar un usuario específico, respetando la jerarquía de roles y la seguridad de acceso a los datos. La eliminación es lógica (soft delete), lo que significa que el usuario no se elimina físicamente de la base de datos, sino que se marca como inactivo o eliminado. El método delega toda la lógica de validación y eliminación al UserService, manteniendo el controlador enfocado en manejar las solicitudes HTTP.
   * * Nota: En este diseño, se ha decidido que un SuperAdmin no pueda eliminar usuarios para agregar una capa adicional de seguridad, evitando eliminaciones críticas que podrían afectar a muchas empresas y usuarios. Solo los Admins pueden eliminar usuarios dentro de su propia empresa, lo que les da control sobre su entorno sin poner en riesgo la integridad del sistema.
   */
  @Delete('delete/:id')
  @Roles( UserRole.ADMIN) //SuperAdmin tampoco puede borrar
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() currentUser: UserPayload,
  ) {
    return this.usersService.remove(id, currentUser);
  }
}