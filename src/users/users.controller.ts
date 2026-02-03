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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateAdminDto } from './dto/create-admin.dto';

// Auth & Security
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';
import { RolesGuard } from 'auth/guards/roles.guard';
import { Roles } from 'auth/decorators/roles.decorator';
import { UserRole } from 'auth/roles.enum';
import { GetUser } from 'auth/decorators/get-user.decorator';
import type { UserPayload } from 'auth/interfaces/user-payload.interface';

/**
 * UsersController
 * * Gestiona el ciclo de vida de los usuarios. La seguridad de "empresaId" y 
 * jerarquía de roles se delega al UsersService para mantener el controlador limpio.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  // ==========================================
  // CREAR USUARIO (UNIFICADO)
  // ==========================================
  /**
   * Endpoint único para crear usuarios (Admins o Workers).
   * - Si eres SUPERADMIN: Debes enviar empresaId en el body.
   * - Si eres ADMIN: El sistema ignorará cualquier empresaId enviado y usará la tuya.
   */
  @Post('create')
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
  @Get()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async findAll(@GetUser() currentUser: UserPayload) {
    return this.usersService.findAllByUser(currentUser);
  }

  // ========================
  // OBTENER USUARIO POR ID
  // ========================
  @Get(':id')
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
  @Patch(':id')
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
  @Delete(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() currentUser: UserPayload,
  ) {
    return this.usersService.remove(id, currentUser);
  }
}