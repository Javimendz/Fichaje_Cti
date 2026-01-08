import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'auth/guards/roles.guard';
import { Roles } from 'auth/decorators/roles.decorator';
import { UserRole } from 'auth/roles.enum';
import { GetUser } from 'auth/decorators/get-user.decorator';
import { User } from 'auth/entities/user.entity';
import { EmpresasService } from 'empresas/empresas.service';

@UseGuards(AuthGuard('jwt'), RolesGuard)
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
  ) {
    // Obtener la empresa
    const empresa = await this.empresasService.findOne(dto.empresaId);
    
    return this.usersService.createAdmin(dto, empresa);
  }

  // ========================
  // CREAR WORKER (ADMIN)
  // ========================
  @Post('worker')
  @Roles(UserRole.ADMIN)
  async createWorker(
    @Body() dto: CreateWorkerDto,
    @GetUser() currentUser: User,
  ) {
    // El worker se crea en la empresa del admin actual
    return this.usersService.createWorker(dto, currentUser.empresa);
  }

  // ========================
  // LISTAR USUARIOS
  // SUPERADMIN ve todos
  // ADMIN ve solo de su empresa
  // ========================
  @Get()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  findAll(@GetUser() currentUser: User) {
    return this.usersService.findAllByUser(currentUser);
  }

  // ========================
  // OBTENER USUARIO POR ID
  // Con validación de permisos
  // ========================
  @Get(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.WORKER)
  async findOne(
    @Param('id') id: string,
    @GetUser() currentUser: User,
  ) {
    return this.usersService.findOneById(id, currentUser);
  }

  // ========================
  // ACTUALIZAR USUARIO
  // ========================
  @Patch(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @GetUser() currentUser: User,
  ) {
    return this.usersService.update(id, dto, currentUser);
  }

  // ========================
  // ELIMINAR USUARIO (SOFT DELETE)
  // ========================
  @Delete(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async remove(
    @Param('id') id: string,
    @GetUser() currentUser: User,
  ) {
    return this.usersService.remove(id, currentUser);
  }
}