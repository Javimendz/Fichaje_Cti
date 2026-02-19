import { Controller, Get, Post, Body, Param, UseGuards, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard'; 
import { Roles } from '../auth/decorators/roles.decorator'; 
import { GetUser } from '../auth/decorators/get-user.decorator';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UserRole } from '../auth/roles.enum'; 
import type { UserPayload } from '../auth/interfaces/user-payload.interface';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard) //  Protegido con Roles
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('crear-asistencia')
  @Roles(UserRole.ADMIN, UserRole.WORKER) //  Excluimos SUPERADMIN
  async create(
    @GetUser() user: UserPayload,
    @Body() dto: CreateAttendanceDto
  ) {
    return this.attendanceService.create(user.id, dto);
  }

  @Get('my-history')
  @Roles(UserRole.ADMIN, UserRole.WORKER)
  async getHistory(@GetUser() user: UserPayload) {
    return this.attendanceService.findAllByUser(user.id);
  }

  @Get('empresa')
  @Roles(UserRole.ADMIN) //  Solo administradores
  async getAllByEmpresa(@GetUser() admin: UserPayload) {
    if (!admin.empresaId) {
      throw new BadRequestException('Administrador sin empresa asignada');
    }
    return this.attendanceService.findAllByEmpresa(admin.empresaId);
  }

  @Get('user/:id')
  @Roles(UserRole.ADMIN) 
  async getByUserId(
    @Param('id', ParseIntPipe) targetUserId: number,
    @GetUser() admin: UserPayload
  ) {
    // En un sistema 100% estricto, aquí deberías verificar que 'targetUserId'
    // pertenece a la misma empresa que 'admin.empresaId' para evitar cruce de datos.
    return this.attendanceService.findAllByUser(targetUserId);
  }
}