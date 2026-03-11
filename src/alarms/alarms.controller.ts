import { Body, Controller, Get, Param, ParseIntPipe, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "auth/guards/jwt-auth.guard";
import { RolesGuard } from "auth/guards/roles.guard";
import { AlarmsService } from "./alarms.service";
import { Roles } from "auth/decorators/roles.decorator";
import { UserRole } from "auth/roles.enum";
import { GetUser } from "auth/decorators/get-user.decorator";
import type { UserPayload } from "auth/interfaces/user-payload.interface";




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
  constructor(private readonly alarmService: AlarmsService) { }

  // Obtener todas las alarmas pendientes de una empresa
  /**
   * Obtener todas las alarmas pendientes de una empresa
   * 
   * @param user - Payload del usuario autenticado
   * @returns Lista de alarmas pendientes de la empresa del usuario
   */

  @Get('pendientes')
  @Roles(UserRole.ADMIN, UserRole.WORKER)
  async getMyAlarms(@GetUser() user: UserPayload) {
    if (user.rol === UserRole.ADMIN) {
      return this.alarmService.findPendingForAdmin(user.empresaId);
    }
    return this.alarmService.findPendingForWorker(user.id);
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