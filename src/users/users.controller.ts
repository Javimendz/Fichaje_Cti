import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { CreateWorkerDto } from './dto/create-worker.dto';

// Auth & Security
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';
import { RolesGuard } from 'auth/guards/roles.guard';
import { Roles } from 'auth/decorators/roles.decorator';
import { UserRole } from 'auth/roles.enum';
import { GetUser } from 'auth/decorators/get-user.decorator';
import { EmpresasService } from 'empresa/empresas.service';
import type { UserPayload } from 'auth/interfaces/user-payload.interface';


/**
 * UsersController
 * 
 * Controlador para la gestión de usuarios en la aplicación.
 * Utiliza guardias de autenticación y autorización para proteger las rutas.
 * Proporciona endpoints para crear administradores y trabajadores,
 * así como para listar, obtener, actualizar y eliminar usuarios.
 * Cada endpoint está protegido por roles específicos para garantizar
 * que solo los usuarios autorizados puedan acceder a ellos.
 * 
 * @see UsersService para la lógica de negocio relacionada con los usuarios.
 * @see EmpresasService para la gestión de empresas relacionada con los usuarios.
 * @controller 'users' define la ruta base para este controlador.
 * @UseGuards(JwtAuthGuard, RolesGuard) aplica los guardias de autenticación y autorización a todas las rutas del controlador.
 * 
 */
@UseGuards(JwtAuthGuard, RolesGuard)  // Guards aplicados a todo el controlador
@Controller('users') // prefijo de ruta
export class UsersController { // Inyección de dependencias
  constructor(
    private readonly usersService: UsersService, // Servicio de usuarios
    private readonly empresasService: EmpresasService, // Servicio de empresas
  ) {}

  // ========================
  // CREAR ADMIN (SUPERADMIN)
  // ========================
  /**
   *  Crea un nuevo usuario administrador asociado a una empresa específica.
   *  Solo accesible por usuarios con rol SUPERADMIN.
   * @param dto Datos del nuevo administrador a crear.
   * @param dto.empresaId ID de la empresa a la que se asociará el nuevo administrador. 
   * @param currentUser Usuario actual que realiza la solicitud, utilizado para validaciones de seguridad.
   * @return El usuario administrador creado.
   */
  @Post('admin') // Endpoint para crear un admin
  @Roles(UserRole.SUPERADMIN) // Solo SUPERADMIN puede acceder
  async createAdmin( // Método para crear un admin
    @Body() dto: CreateAdminDto, // Datos del admin desde el cuerpo de la solicitud
    @GetUser() currentUser: UserPayload, // Usuario actual desde el token
  ) {
    // 1. Obtener la empresa (Pasando currentUser para evitar el error TS2554)
    const empresa = await this.empresasService.findOne(dto.empresaId, currentUser); // Usar el empresaId del DTO
    
    // 2. Crear el administrador asociado a la empresa
    
    return this.usersService.createAdmin(dto, empresa);
  }

  // ========================
  // CREAR WORKER (ADMIN)
  // ========================
  /**
   *  Crea un nuevo usuario trabajador asociado a la empresa del administrador que realiza la solicitud.
   *  Solo accesible por usuarios con rol ADMIN.
   *   
   * @param dto Datos del nuevo trabajador a crear.
   * @param currentUser Usuario actual que realiza la solicitud, utilizado para obtener la empresa asociada.
   * @return El usuario trabajador creado.
   */
  /*

  @Post('worker') // Endpoint para crear un worker
  @Roles(UserRole.ADMIN) //
  async createWorker(
    @Body() dto: CreateWorkerDto,
    @GetUser() currentUser: UserPayload,
  ) {
    // 1. El Admin solo puede crear trabajadores para su propia empresa
    // Buscamos la empresa usando su empresaId del token para mayor seguridad
    if (!currentUser.empresaId) throw new Error('El administrador no tiene empresa');
    
    const empresa = await this.empresasService.findOne(currentUser.empresaId, currentUser);
    
    return this.usersService.createWorker(dto, empresa);
  }
*/

  // ========================
  // LISTAR USUARIOS
  // ========================
  @Get()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  findAll(@GetUser() currentUser: UserPayload) {
    return this.usersService.findAllByUser(currentUser);
  }

  // ========================
  // OBTENER USUARIO POR ID
  // ========================
 @Get(':id') 
 @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
async findOne(
  @Param('id', ParseUUIDPipe) id: string, 
  @GetUser() currentUser: UserPayload,
) {
  return this.usersService.findOneById(id, currentUser);
}
  // ========================
  // ACTUALIZAR / ELIMINAR
  // ========================
  @Patch(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @GetUser() currentUser: UserPayload,
  ) {
    return this.usersService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() currentUser: UserPayload,
  ) {
    return this.usersService.remove(id, currentUser);
  }
}