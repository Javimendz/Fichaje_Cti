import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { RevisarSolicitudDto } from "./dto/revisar-solicitud.dto";
import { GetUser } from "auth/decorators/get-user.decorator";
import { Roles } from "auth/decorators/roles.decorator";
import { UserRole } from "auth/roles.enum";
import { User } from "auth/entities/user.entity";
import { CreateSolicitudDto } from "./dto/create-solicitud.dto";
import { SolicitudesService } from "./solicitud.service";
import { AuthGuard } from "@nestjs/passport";

@Controller('solicitudes')
@UseGuards(AuthGuard())
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  @Post()
  create(@Body() dto: CreateSolicitudDto, @GetUser() user: User) {
    return this.solicitudesService.create(dto, user);
  }

  @Patch(':id/revisar')
  @Roles(UserRole.ADMIN) // Solo Admins
  revisar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RevisarSolicitudDto,
    @GetUser() admin: User,
  ) {
    return this.solicitudesService.revisar(id, dto, admin);
  }

  @Get('mis-solicitudes')
  findAllByUser(@GetUser() user: User) {

    if (!user.empresaId) {
    throw new BadRequestException('El usuario no tiene una empresa asociada');
  }

    return this.solicitudesService.findAllByEmpresa(user.empresaId, user.id);
  }
}