import { Controller, Get, Post, Body, Param, UseGuards, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard'; 
import { Roles } from '../auth/decorators/roles.decorator'; 
import { GetUser } from '../auth/decorators/get-user.decorator';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UserRole } from '../auth/roles.enum'; 
import type { UserPayload } from '../auth/interfaces/user-payload.interface';


// 🟢 AttendanceController
// Controlador para gestionar las asistencias (fichajes) de los trabajadores.
// Permite a los trabajadores registrar su asistencia y a los administradores revisar el historial de asistencias de su empresa.
/**
 * AttendanceController 
 * Controlador para gestionar las asistencias (fichajes) de los trabajadores.
 * Permite a los trabajadores registrar su asistencia y a los administradores revisar el historial de asistencias de su empresa.
 * Endpoints:
 * - POST /asistencia/crear-asistencia: Permite a un trabajador registrar su asistencia (presente o ausente con motivo).
 * - GET /asistencia/my-history: Permite a un trabajador ver su historial de asistencias.
 * - GET /asistencia/empresa: Permite a un administrador ver todas las asistencias de su empresa.
 * - GET /asistencia/user/:id: Permite a un administrador ver el historial de asistencias de un trabajador específico por su ID.
 * Utiliza guards para proteger los endpoints y asegurar que solo usuarios autenticados con los roles adecuados puedan acceder a ellos.
 * 
 */
@Controller('asistencia')
@UseGuards(JwtAuthGuard, RolesGuard) 
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // --- CREAR ASISTENCIA: ADMIN Y WORKER ---
  /* Endpoint para que un trabajador registre su asistencia.
    * El trabajador puede marcarse como presente o ausente con un motivo.
    * El sistema vincula automáticamente el registro con el ID del usuario autenticado.
    * Solo los usuarios con rol ADMIN o WORKER pueden acceder a este endpoint.
    * Ejemplo de payload:
    {
      "presente": true,
      "motivo": "Llegada puntual"
    } 
      o
    {      "presente": false,
      "motivo": "Enfermedad"
    }
      @Roles(UserRole.ADMIN, UserRole.WORKER) asegura que solo los trabajadores y administradores puedan registrar asistencias, excluyendo a los superadministradores que no deberían tener esta función.
      
    */
  @Post('crear-asistencia')
  @Roles(UserRole.ADMIN, UserRole.WORKER) //  Excluimos SUPERADMIN
  async create(
    @GetUser() user: UserPayload,
    @Body() dto: CreateAttendanceDto
  ) {
    return this.attendanceService.create(user, dto);
  }

  // --- HISTORIAL PERSONAL: ADMIN Y WORKER ---
  /* Endpoint para que un trabajador vea su propio historial de asistencias.
    * El sistema devuelve todas las asistencias registradas por el usuario autenticado, ordenadas por fecha (más reciente primero).
    * Solo los usuarios con rol ADMIN o WORKER pueden acceder a este endpoint para revisar su propio historial.     
    *   @Roles(UserRole.ADMIN, UserRole.WORKER) permite que tanto los trabajadores como los administradores puedan revisar su historial personal de asistencias, lo cual es útil para que los administradores también puedan verificar sus propios registros.
    */
  @Get('my-history')
  @Roles(UserRole.ADMIN, UserRole.WORKER)
  async getHistory(@GetUser() user: UserPayload) {
return this.attendanceService.findAllByUser(user.id, user.empresaId!);  }

  // --- HISTORIAL DE EMPRESA: SOLO ADMIN ---
  /* Endpoint para que un administrador vea todas las asistencias de su empresa.
    * El sistema devuelve todas las asistencias registradas por los trabajadores de la empresa del administrador autenticado, ordenadas por fecha (más reciente primero).
    * Solo los usuarios con rol ADMIN pueden acceder a este endpoint para revisar el historial de asistencias de su empresa, asegurando que los trabajadores no puedan ver los registros de otros empleados.
    * @Roles(UserRole.ADMIN) garantiza que solo los administradores puedan acceder a este endpoint, protegiendo la privacidad de los trabajadores y asegurando que solo el personal autorizado pueda revisar los registros de asistencia de la empresa.
    */  
  @Get('empresa')
  @Roles(UserRole.ADMIN) //  Solo administradores
  async getAllByEmpresa(@GetUser() admin: UserPayload) {
    if (!admin.empresaId) {
      throw new BadRequestException('Administrador sin empresa asignada');
    }
    return this.attendanceService.findAllByEmpresa(admin.empresaId);
  }

  // --- HISTORIAL DE UN TRABAJADOR ESPECÍFICO: SOLO ADMIN ---
  /* Endpoint para que un administrador vea el historial de asistencias de un trabajador específico por su ID.
    * El sistema devuelve todas las asistencias registradas por el trabajador identificado por el ID proporcionado, ordenadas por fecha (más reciente primero). 
    * Solo los usuarios con rol ADMIN pueden acceder a este endpoint para revisar el historial de asistencias de un trabajador específico, asegurando que los trabajadores no puedan ver los registros de otros empleados.
    * @Roles(UserRole.ADMIN) garantiza que solo los administradores puedan acceder a este endpoint, protegiendo la privacidad de los trabajadores y asegurando que solo el personal autorizado pueda revisar los registros de asistencia de otros empleados.
    * El parámetro :id en la ruta se utiliza para identificar al trabajador específico cuyo historial se desea consultar, lo que permite a los administradores revisar fácilmente los registros de asistencia de cualquier empleado dentro de su empresa.
    */
  @Get('user/:id')
  @Roles(UserRole.ADMIN) 
  async getByUserId(
    @Param('id', ParseIntPipe) targetUserId: number,
    @GetUser() admin: UserPayload
  ) {
    if (!admin.empresaId) {
    throw new BadRequestException('Administrador sin empresa asignada');
  }
  return this.attendanceService.findAllByUser(targetUserId, admin.empresaId);
  }
}