import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'auth/guards/roles.guard';
import { Roles } from 'auth/decorators/roles.decorator';
import { UserRole } from 'auth/roles.enum';
import { AllowedPhonesService } from 'allowed-phones/allowed-phones.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { CreateAdminDto } from './dto/create-admin.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly allowedPhonesService: AllowedPhonesService,
  ) {}

  // ========================
  // REGISTRO DE USUARIO
  // ========================
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    // Validar allowed phones
    const allowed = await this.allowedPhonesService.checkPhoneAllowed(
      createUserDto.telefono,
    );
    if (!allowed) {
      throw new ForbiddenException(
        'Este número no está autorizado para registrarse',
      );
    }

    // Crear usuario
    const user = await this.usersService.create(createUserDto);

    // Marcar teléfono como usado
    await this.allowedPhonesService.markUsed(createUserDto.telefono);

    return user;
  }

  // ========================
  // LISTAR USUARIOS
  // Solo admin
  // ========================
  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  // ========================
  // OBTENER USUARIO POR ID
  // Admin puede ver cualquier usuario
  // Usuario normal solo puede ver su propio ID
  // ========================
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.USER)
  async findOne(@Param('id') id: string, @Body('requestUserId') requestUserId: string) {
    const user = await this.usersService.findOne(id);

    // Validación simple: usuario solo puede ver su propio perfil
    if (
      user.rol.includes(UserRole.USER) &&
      user.id !== requestUserId
    ) {
      throw new ForbiddenException('No autorizado');
    }

    return user;
  }

  // ========================
  // ACTUALIZAR USUARIO
  // ========================
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.USER)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Body('requestUserId') requestUserId: string,
  ) {
    // Usuario normal solo puede actualizar su propio perfil
    const user = await this.usersService.findOne(id);
    if (
      user.rol.includes(UserRole.USER) &&
      user.id !== requestUserId
    ) {
      throw new ForbiddenException('No autorizado');
    }

    return this.usersService.update(id, updateUserDto);
  }

  // ========================
  // ELIMINAR USUARIO
  // Solo admin
  // ========================
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // ========================
  // ACTUALIZAR ROL
  // Solo admin
  // ========================
  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  updateRole(
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateRole(id, updateUserRoleDto.rol);
  }

  @Post('create-admin')
  @Roles(UserRole.ADMIN) // solo admin puede usar este endpoint
  async createAdmin(@Body() dto: CreateAdminDto) {
    const user = await this.usersService.createAdmin(dto);
    return user;
  }

}

