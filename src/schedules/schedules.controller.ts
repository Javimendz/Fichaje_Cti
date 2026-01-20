import { Controller, Get, Post, Body, Param, Delete, ParseUUIDPipe, UseGuards, BadRequestException, UnauthorizedException, Patch } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { SchedulesService } from './schedules.service';
import { GetUser } from '../auth/decorators/get-user.decorator'; // Ajusta la ruta
import { User } from '../auth/entities/user.entity';
import { CreateHorarioDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { AllowedUserService } from 'allowed-user/allowed-user.service';
import { UserRole } from 'auth/roles.enum';
import { Roles } from 'auth/decorators/roles.decorator';

@Controller('schedules')
@UseGuards(AuthGuard())
export class SchedulesController {
  constructor(
    private readonly schedulesService: SchedulesService,
   private readonly allowedUserService: AllowedUserService,
  ) {}

  @Post()
  create(
    @Body() createHorarioDto: CreateHorarioDto,
    @GetUser() user: User 
  ) {
    // Validación de seguridad para el modo estricto de TS
    if (!user.empresaId) {
      throw new UnauthorizedException('No tienes una empresa asociada para crear horarios');
    }
    // Pasamos el DTO y el ID ya validado como string
    return this.schedulesService.create(createHorarioDto, user);
  }

  @Get()
  findAll(@GetUser() user: User) {
    if (!user.empresaId) {
      throw new BadRequestException('Usuario sin empresa asignada');
    }
    return this.schedulesService.findAllByEmpresa(user.empresaId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    if (!user.empresaId) throw new UnauthorizedException('Usuario sin empresa');
    
    return this.schedulesService.findOne(id, user.empresaId);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    if (!user.empresaId) throw new UnauthorizedException('Usuario sin empresa');
    
    return this.schedulesService.remove(id, user.empresaId);
  }
@Patch(':id/assign-schedule')
@UseGuards(AuthGuard())
async assignSchedule(
  @Param('id', ParseUUIDPipe) userId: string,
  @Body() dto: UpdateScheduleDto,
  @GetUser() admin: User // Obtenemos el admin para sacar su empresaId
) {

  if(!admin.empresaId) {
    throw new UnauthorizedException('El administrador no tiene una empresa asignada');
  }

  return await this.allowedUserService.assignSchedule(
    userId, 
    dto.horarioId, 
    admin.empresaId
  );
}

@Patch(':userId/assign-worker')
@Roles(UserRole.ADMIN)
async assignWorkerToSchedule(
  @Param('userId', ParseUUIDPipe) userId: string,
  @Body('horarioId', ParseUUIDPipe) horarioId: string,
  @GetUser() admin: User,
) {
  if (!admin.empresaId) throw new BadRequestException('Admin sin empresa');
  
  // Delegamos la unión al AllowedUserService
  return await this.allowedUserService.assignSchedule(userId, horarioId, admin.empresaId);
}


}