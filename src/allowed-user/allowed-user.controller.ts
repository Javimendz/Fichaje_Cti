import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UnauthorizedException, ParseUUIDPipe, ParseIntPipe } from '@nestjs/common';
import { AllowedUserService } from './allowed-user.service';
import { CreateAllowedUserDto } from './dto/create-allowed-user.dto';
import { UpdateAllowedUserDto } from './dto/update-allowed-user.dto';
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';
import { User } from 'auth/entities/user.entity';
import { GetUser } from 'auth/decorators/get-user.decorator';
import { UserRole } from 'auth/roles.enum';
import { RolesGuard } from 'auth/guards/roles.guard';
import { Roles } from 'auth/decorators/roles.decorator';

@Controller('allowed-user')
@UseGuards(JwtAuthGuard)
export class AllowedUserController {
  constructor(private readonly allowedUserService: AllowedUserService) {}

  @Post()
  create(
    @Body() createAllowedUserDto: CreateAllowedUserDto,
    @GetUser() admin: User 
  ) {
    return this.allowedUserService.create(createAllowedUserDto, admin);
  }

  @Get()
  findAll(@GetUser() admin: User) {
    // 1. Si es SUPERADMIN, puede ver todos los usuarios (sin filtrar por empresa)
    if (admin.rol === UserRole.SUPERADMIN) {
      return this.allowedUserService.findAll();
    }

    // 2. Si es ADMIN, verificamos que tenga empresa y filtramos
    if (!admin.empresaId) {
      throw new UnauthorizedException('El administrador no tiene una empresa asignada');
    }

    return this.allowedUserService.findAllByEmpresa(admin.empresaId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.allowedUserService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateAllowedUserDto: UpdateAllowedUserDto) {
    return this.allowedUserService.update(id, updateAllowedUserDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.allowedUserService.remove(id);
  }

  @Patch(':allowedUserId/assign-schedule')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async assignSchedule(
    @Param('allowedUserId', ParseIntPipe) allowedUserId: number,
    @Body('horarioId', ParseIntPipe) horarioId: number,
    @GetUser() admin: User,
  ) {
    // Definimos el alcance de la empresa según el rol
    const empresaId = admin.rol === UserRole.SUPERADMIN ? null : admin.empresaId;

    if (admin.rol !== UserRole.SUPERADMIN && !empresaId) {
      throw new UnauthorizedException(
        'No tienes una empresa asignada para realizar esta acción',
      );
    }

    // Llamada al servicio
    return await this.allowedUserService.assignSchedule(
      allowedUserId,
      horarioId,
      empresaId,
    );
  }

}