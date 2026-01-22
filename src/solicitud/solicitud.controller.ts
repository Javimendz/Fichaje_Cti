import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { RevisarSolicitudDto } from "./dto/revisar-solicitud.dto";
import { GetUser } from "auth/decorators/get-user.decorator";
import { Roles } from "auth/decorators/roles.decorator";
import { UserRole } from "auth/roles.enum";
import { User } from "auth/entities/user.entity";
import { CreateSolicitudDto } from "./dto/create-solicitud.dto";
import { SolicitudesService } from "./solicitud.service";
import { AuthGuard } from "@nestjs/passport";

/**
 * SolicitudesController
 * Controlador encargado de gestionar las rutas relacionadas con las solicitudes.
 * Proporciona endpoints para crear nuevas solicitudes, revisar solicitudes existentes
 * y listar solicitudes por empresa y usuario.
 * Métodos principales:
 * - create: Endpoint para que un usuario cree una nueva solicitud.
 * - revisar: Endpoint para que un administrador revise una solicitud.
 * - findAllByUser: Endpoint para que un usuario liste sus propias solicitudes.
 * @see SolicitudesService para la lógica de negocio relacionada con las solicitudes.
 * @controller 'solicitudes' define la ruta base para este controlador.
 * @UseGuards(AuthGuard()) aplica el guard de autenticación a todas las rutas del controlador. 
 */
@Controller('solicitudes') // prefijo de ruta
@UseGuards(AuthGuard()) // Aplica el guard de autenticación a todo el controlador
export class SolicitudesController { // Inyección de dependencias
  constructor(private readonly solicitudesService: SolicitudesService) {} //

  @Post() // Endpoint para crear una solicitud
  create(@Body() dto: CreateSolicitudDto, @GetUser() user: User) { // Obtener datos del cuerpo y usuario actual
    return this.solicitudesService.create(dto, user); // Llamar al servicio para crear la solicitud
  }

  /**
   *  Revisa una solicitud específica, permitiendo aprobarla o rechazarla.
   *  
   * @param id ID de la solicitud a revisar.
   * @param dto Datos para la revisión de la solicitud.
   * @param admin Usuario administrador que realiza la revisión.
   * @returns Resultado de la revisión de la solicitud.
   * @throws BadRequestException si la solicitud no existe o ya ha sido revisada.
   * @see RevisarSolicitudDto
   * @see SolicitudesService.revisar
   * 
   */
  @Patch(':id/revisar') // Endpoint para revisar una solicitud
  @Roles(UserRole.ADMIN) // Solo Admins
  revisar(
    @Param('id', ParseUUIDPipe) id: string, // Validar UUID del parámetro
    @Body() dto: RevisarSolicitudDto, // Obtener datos del cuerpo
    @GetUser() admin: User, // Obtener usuario actual
  ) {
    return this.solicitudesService.revisar(id, dto, admin); // Llamar al servicio para revisar la solicitud
  }

  /**
   *  Lista todas las solicitudes asociadas al usuario autenticado.
   * 
   * @param user Usuario autenticado.
   * @returns Lista de solicitudes del usuario.
   * @throws BadRequestException si el usuario no tiene una empresa asociada.
   * @see SolicitudesService.findAllByEmpresa 
   */
  @Get('mis-solicitudes') // Endpoint para listar solicitudes del usuario
  findAllByUser(@GetUser() user: User) { // Obtener usuario actual

    if (!user.empresaId) { // Validar empresa
    throw new BadRequestException('El usuario no tiene una empresa asociada'); // Error si no tiene empresa
  }

    return this.solicitudesService.findAllByEmpresa(user.empresaId, user.id); // Llamar al servicio para listar solicitudes del usuario
  }
}