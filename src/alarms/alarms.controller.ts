import { Body, Controller, Get, Param, ParseIntPipe, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "auth/guards/jwt-auth.guard";
import { RolesGuard } from "auth/guards/roles.guard";
import { AlarmsService } from "./alarms.service";
import { Roles } from "auth/decorators/roles.decorator";
import { UserRole } from "auth/roles.enum";
import { GetUser } from "auth/decorators/get-user.decorator";
import type { UserPayload } from "auth/interfaces/user-payload.interface";

@Controller('alarmas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlarmController {
  constructor(private readonly alarmService: AlarmsService) {}

  @Get('pendientes')
  @Roles(UserRole.ADMIN)
  async getMyAlarms(@GetUser() user: UserPayload) {
    return this.alarmService.findAllByCompany(user.empresaId);
  }

  @Put('revisar/:id')
  @Roles(UserRole.ADMIN)
  async readAlarm(@Param('id', ParseIntPipe) id: number, @GetUser() user: UserPayload) {
    return this.alarmService.markAsRead(id, user.empresaId);
  }



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