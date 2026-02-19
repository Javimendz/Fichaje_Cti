import { 
  Controller, Get, Post, Body, Param, Delete, 
  UseGuards, ParseIntPipe, Put, UnauthorizedException, Logger 
} from '@nestjs/common';

import { TimeSlotService } from './timeSlot.service';
import { CreateTimeSlotDto } from './dto/create-timeSlot.dto';
import { UpdateTimeSlotDto } from './dto/update-timeSlot.dto';

// Auth & Roles Imports
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';
import { RolesGuard } from 'auth/guards/roles.guard';
import { Roles } from 'auth/decorators/roles.decorator';
import { UserRole } from 'auth/roles.enum';
import { GetUser } from 'auth/decorators/get-user.decorator';
import type { UserPayload } from 'auth/interfaces/user-payload.interface'; // import type para evitar error de compilación

@Controller('franja-horaria')
@UseGuards(JwtAuthGuard, RolesGuard) 
export class TimeSlotController {
  private readonly logger = new Logger(TimeSlotController.name);

  constructor(private readonly franjaHorariaService: TimeSlotService) {}

  // --- CREAR: SOLO ADMIN ---
  @Post('crear')
  @Roles(UserRole.ADMIN)
  create(
    @Body() createFranjaHorariaDto: CreateTimeSlotDto,
    @GetUser() user: UserPayload
  ) {
    this.validateEmpresa(user);
    // Pasamos el usuario para validar que el Schedule/Día pertenece a su empresa
    return this.franjaHorariaService.create(createFranjaHorariaDto, user);
  }

  // --- LISTAR: ADMIN Y WORKER ---
  // (Opcional: Filtrar por día o scheduleId suele ser más común que listar TODO)
  @Get('list-franja-horaria')
  @Roles(UserRole.ADMIN, UserRole.WORKER)
  findAll(@GetUser() user: UserPayload) {
    this.validateEmpresa(user);
    return this.franjaHorariaService.findAll(user);
  }

  // --- BUSCAR UNO: ADMIN Y WORKER ---
  @Get('find/:id')
  @Roles(UserRole.ADMIN, UserRole.WORKER)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: UserPayload
  ) {
    this.validateEmpresa(user);
    return this.franjaHorariaService.findOne(id, user);
  }

  // --- EDITAR: SOLO ADMIN ---
  @Put('update/:id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateFranjaHorariaDto: UpdateTimeSlotDto,
    @GetUser() user: UserPayload
  ) {
    this.validateEmpresa(user);
    this.logger.log(`[Audit] Admin ${user.email} actualizando franja ${id}`);
    return this.franjaHorariaService.update(id, updateFranjaHorariaDto, user);
  }

  // --- BORRAR: SOLO ADMIN ---
  @Delete('delete/:id')
  @Roles(UserRole.ADMIN)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: UserPayload
  ) {
    this.validateEmpresa(user);
    this.logger.warn(`[Audit] Admin ${user.email} eliminando franja ${id}`);
    return this.franjaHorariaService.remove(id, user);
  }

  // --- HELPER PRIVADO ---
  private validateEmpresa(user: UserPayload) {
    if (!user.empresaId) {
      throw new UnauthorizedException('Usuario sin empresa asignada');
    }
  }


@Get('by-schedule/:scheduleId')
@Roles(UserRole.ADMIN, UserRole.WORKER)
findAllBySchedule(
  @Param('scheduleId', ParseIntPipe) scheduleId: number,
  @GetUser() user: UserPayload
) {
  // En el servicio implementarías un filtro donde schedule.id = scheduleId
this.validateEmpresa(user);
    // Llamamos al servicio pasando el ID del horario Y el usuario (para seguridad)
    return this.franjaHorariaService.findAllBySchedule(scheduleId, user);}

}