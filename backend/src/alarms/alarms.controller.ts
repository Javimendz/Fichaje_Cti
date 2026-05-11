import { Body, Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AlarmsService } from "./alarms.service";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../auth/roles.enum";
import { GetUser } from "../auth/decorators/get-user.decorator";
import type { UserPayload } from "../auth/interfaces/user-payload.interface";
import { AlarmCronService } from "./alarms.crone.service";



// AlarmController
// Controlador para manejar operaciones relacionadas con alarmas  
//
// Endpoint: /alarmas
// Métodos: GET, PUT
// Descripción: Controlador para manejar operaciones relacionadas con alarmas
//
// Endpoint: /alarmas/pendientes
// Métodos: GET
// Descripción: Obtener todas las alarmas pendientes de una empresa
//
// Endpoint: /alarmas/revisar/:id
// Métodos: PUT
// Descripción: Marcar una alarma como leída
//
// Endpoint: /alarmas/resolver/:id
// Métodos: PUT
// Descripción: Resolver una alarma con una nota opcional 

@Controller('alarmas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlarmController {
  constructor(private readonly alarmService: AlarmsService , private readonly alarmCronService: AlarmCronService) { }

  // Obtener todas las alarmas pendientes de una empresa
  /**
   * Obtener todas las alarmas pendientes de una empresa
   * 
   * @param user - Payload del usuario autenticado
   * @returns Lista de alarmas pendientes de la empresa del usuario
   */

/**
   * Obtiene todas las alarmas de un trabajador específico.
   * Reservado para Administradores de la misma empresa.
   */
  @Get('worker/:workerId')
  @Roles(UserRole.ADMIN) 
  async getByWorkerId(
    @Param('workerId', ParseIntPipe) workerId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @GetUser() admin: UserPayload
  ) {
    return this.alarmService.findAllByWorker(workerId, admin, page, limit);
  }
  
  @Post('debug/force-audit')
@Roles(UserRole.ADMIN, UserRole.WORKER) // Solo tú puedes forzar esto
async forceAudit() {
  // Forzamos la auditoría semanal aunque sea hoy otro día
  await this.alarmCronService.runAuditLogic(true, false);
  return { message: 'Auditoría semanal forzada ejecutada. Revisa los logs y la base de datos.' };
}

 @Get('pendientes')
  @Roles(UserRole.ADMIN, UserRole.WORKER)
  async getMyAlarms(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @GetUser() user: UserPayload
  ) {
    if (user.rol === UserRole.ADMIN) {
      return this.alarmService.findPendingForAdmin(user.empresaId, page, limit);
    }
    return this.alarmService.findPendingForWorker(user.id, page, limit);
  }
  // Marcar una alarma como leída
  /**
   * Marcar una alarma como leída
   * 
   * @param id - ID de la alarma a marcar como leída
   * @param user - Payload del usuario autenticado
   * @returns Alarma marcada como leída
   */
  @Put('revisar/:id')
  @Roles(UserRole.ADMIN, UserRole.WORKER)
  async readAlarm(@Param('id', ParseIntPipe) id: number, @GetUser() user: UserPayload) {
    return this.alarmService.markAsRead(id, user.id, user.rol, user.empresaId);
  }


  // Resolver una alarma
  /**
   * Resolver una alarma
   * 
   * @param id - ID de la alarma a resolver
   * @param nota - Nota opcional para resolver la alarma
   * @param user - Payload del usuario autenticado
   * @returns Alarma marcada como resuelta
   */
  @Put('resolver/:id')
  @Roles(UserRole.ADMIN)
  async resolve(
    @Param('id', ParseIntPipe) id: number,
    @Body('nota') nota: string,
    @GetUser() user: UserPayload
  ) {
    // Ahora pasamos los 3 argumentos: ID de alarma, la nota y el ID de la empresa del Admin
    return this.alarmService.resolve(id, nota, user.empresaId);
  }
}