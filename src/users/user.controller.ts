import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
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
 * jerarquía de roles se delega al UsersService para mantener el controlador limpio.
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
   */
  @Post('crear-user')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async create(
    @Body() dto: CreateAdminDto, 
    @GetUser() currentUser: UserPayload,
  ) {
    return this.usersService.create(dto, currentUser);
  }

  // Nota: Se ha eliminado @Post('admin') y @Post('worker') porque 
  // el método raíz @Post() ya gestiona ambos casos mediante el DTO y el Service.

  // ========================
  // LISTAR USUARIOS
  // ========================
  @Get('list-users')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async findAll(@GetUser() currentUser: UserPayload) {
    return this.usersService.findAllByUser(currentUser);
  }

  // ========================
  // OBTENER USUARIO POR ID
  // ========================
  
  @Get('find/:id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() currentUser: UserPayload,
  ) {
    return this.usersService.findOneById(id, currentUser);
  }

  // ========================
  // ACTUALIZAR USUARIO
  // ========================
  @Put('update/:id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
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
  @Delete('delete/:id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() currentUser: UserPayload,
  ) {
    return this.usersService.remove(id, currentUser);
  }
}