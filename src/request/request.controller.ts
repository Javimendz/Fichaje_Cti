import { BadRequestException, Body, Controller, ForbiddenException, Get, NotFoundException, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { RequestStatus, RevisarRequestDto } from "./dto/revisar-request.dto";
import { GetUser } from "auth/decorators/get-user.decorator";
import { Roles } from "auth/decorators/roles.decorator";
import { UserRole } from "auth/roles.enum";
import { User } from "auth/entities/user.entity";
import { CreateRequestDto } from "./dto/create-request.dto";
import { SolicitudesService } from "./request.service";
import { AuthGuard } from "@nestjs/passport";
import type { UserPayload } from "auth/interfaces/user-payload.interface";
import { UpdateRequestDto } from "./dto/update-request.dto";
import { JwtAuthGuard } from "auth/guards/jwt-auth.guard";
import { RolesGuard } from "auth/guards/roles.guard";

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
@Controller('request') // prefijo de ruta
@Roles(UserRole.ADMIN, UserRole.WORKER)
@UseGuards(AuthGuard()) // Aplica el guard de autenticación a todo el controlador
export class RequestController { // Inyección de dependencias
  constructor(private readonly solicitudesService: SolicitudesService) { } //

  @Post('crear-request')
  @Roles(UserRole.ADMIN, UserRole.WORKER)
  create(@Body() dto: CreateRequestDto, @GetUser() user: UserPayload) {
    return this.solicitudesService.create(dto, user);
  }
  /**
   *  Revisa una solicitud específica, permitiendo aprobarla o rechazarla.
   *  
   * @param id ID de la solicitud a revisar.
   * @param dto Datos para la revisión de la solicitud.
   * @param admin Usuario administrador que realiza la revisión.
   * @returns Resultado de la revisión de la solicitud.
   * @throws BadRequestException si la solicitud no existe o ya ha sido revisada.
   * @see RevisarRequestDto
   * @see SolicitudesService.revisar
   * 
   */
  @Put('check/:id') // Endpoint para revisar una solicitud
  @Roles(UserRole.ADMIN) // Solo Admins
  revisar(
    @Param('id', ParseIntPipe) id: number, // Validar UUID del parámetro
    @Body() dto: RevisarRequestDto, // Obtener datos del cuerpo
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
  @Get('my-request') // Endpoint para listar solicitudes del usuario
  @Roles(UserRole.ADMIN, UserRole.WORKER)
  findAllByUser(@GetUser() user: User) { // Obtener usuario actual

    if (!user.empresaId) { // Validar empresa
      throw new BadRequestException('El usuario no tiene una empresa asociada'); // Error si no tiene empresa
    }

    return this.solicitudesService.findAllByEmpresa(user.empresaId, user.id); // Llamar al servicio para listar solicitudes del usuario
  }
  @Get('company-request')
  @Roles(UserRole.ADMIN) // Solo el admin ve todas las solicitudes de la empresa
  findAllByEmpresa(@GetUser() admin: User) {
    if (!admin.empresaId) {
      throw new BadRequestException('El administrador no tiene una empresa asociada.');
    }
    return this.solicitudesService.findAllByEmpresa(admin.empresaId);
  }


  @Get('find/:id')
  @Roles(UserRole.ADMIN, UserRole.WORKER)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: UserPayload // Necesitamos al user para validar que no vea datos ajenos
  ) {
    return await this.solicitudesService.findOne(id, user);
  }

  @Put('edit-request/:id') // Usamos PATCH para actualizaciones
  @Roles(UserRole.WORKER, UserRole.ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateRequestDto, // Necesitas un DTO con los cambios
    @GetUser() user: UserPayload,
  ) {
    return await this.solicitudesService.update(id, updateDto, user);
  }


@Get('historial')
@Roles(UserRole.ADMIN, UserRole.WORKER)
@UseGuards(JwtAuthGuard, RolesGuard)
async getHistorial(
  @GetUser() user: UserPayload,
  @Query('estado') estado?: string // 👈 Lo dejamos como 'string' normal
) {
  return await this.solicitudesService.findHistorial(user.empresaId, estado);
}
}