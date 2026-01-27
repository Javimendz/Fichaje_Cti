import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UnauthorizedException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AllowedUserService } from './allowed-user.service';
import { CreateAllowedUserDto } from './dto/create-allowed-user.dto';
import { UpdateAllowedUserDto } from './dto/update-allowed-user.dto';
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';
import { GetUser } from 'auth/decorators/get-user.decorator';
import { User } from 'auth/entities/user.entity';
import { UserRole } from 'auth/roles.enum';
import { Roles } from 'auth/decorators/roles.decorator';
import { RolesGuard } from 'auth/guards/roles.guard';

@Controller('allowed-user')
@UseGuards(JwtAuthGuard)
export class AllowedUserController {
  constructor(private readonly allowedUserService: AllowedUserService) {}

  @Post()
  create(
    @Body() dto: CreateAllowedUserDto,
    @GetUser() admin: User,
  ) {
    return this.allowedUserService.create(dto, admin);
  }

  @Get()
  findAll(@GetUser() admin: User) {
    if (admin.rol === UserRole.SUPERADMIN) {
      return this.allowedUserService.findAll();
    }

    if (!admin.empresaId) {
      throw new UnauthorizedException(
        'El administrador no tiene una empresa asignada',
      );
    }

    return this.allowedUserService.findAllByEmpresa(admin.empresaId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.allowedUserService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAllowedUserDto,
  ) {
    return this.allowedUserService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.allowedUserService.remove(id);
  }

  /**
   * ✅ ASIGNAR HORARIO A UN TRABAJADOR (AllowedUser)
   * ESTE ES EL ÚNICO ENDPOINT PARA ESTA ACCIÓN
   */
  @Patch(':allowedUserId/assign-schedule')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  assignSchedule(
    @Param('allowedUserId', ParseUUIDPipe) allowedUserId: string,
    @Body('horarioId', ParseUUIDPipe) horarioId: string,
    @GetUser() admin: User,
  ) {
    const empresaId =
      admin.rol === UserRole.SUPERADMIN ? null : admin.empresaId;

    if (admin.rol !== UserRole.SUPERADMIN && !empresaId) {
      throw new UnauthorizedException(
        'No tienes una empresa asignada para realizar esta acción',
      );
    }

    return this.allowedUserService.assignSchedule(
      allowedUserId,
      horarioId,
      empresaId,
    );
  }
}
