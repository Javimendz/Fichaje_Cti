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
import { EmpresasService } from 'empresas/empresas.service';
import type { UserPayload } from 'auth/interfaces/user-payload.interface';

@UseGuards(JwtAuthGuard, RolesGuard) // ✅ Usamos JwtAuthGuard personalizado
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly empresasService: EmpresasService,
  ) {}

  // ========================
  // CREAR ADMIN (SUPERADMIN)
  // ========================
  @Post('admin')
  @Roles(UserRole.SUPERADMIN)
  async createAdmin(
    @Body() dto: CreateAdminDto,
    @GetUser() currentUser: UserPayload, // ✅ Añadido para validar seguridad en EmpresasService
  ) {
    // 1. Obtener la empresa (Pasando currentUser para evitar el error TS2554)
    const empresa = await this.empresasService.findOne(dto.empresaId, currentUser);
    
    return this.usersService.createAdmin(dto, empresa);
  }

  // ========================
  // CREAR WORKER (ADMIN)
  // ========================
  @Post('worker')
  @Roles(UserRole.ADMIN)
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
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.WORKER)
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