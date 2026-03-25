import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query, ParseIntPipe, Delete, Put } from '@nestjs/common';
import { ActividadService } from './activity.service';
import { CreateActividadDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

// Seguridad
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';
import { RolesGuard } from 'auth/guards/roles.guard';
import { Roles } from 'auth/decorators/roles.decorator';
import { UserRole } from 'auth/roles.enum';
import { GetUser } from 'auth/decorators/get-user.decorator';
import type { UserPayload } from 'auth/interfaces/user-payload.interface';

/**
 *  //  Catalogo de actividades por empresa
 * Si el usuario es trabajador, solo verá las actividades activas
 * Si el usuario es admin, podrá ver todas las actividades o solo las activas según el parámetro
 * @param activas Si se desea ver solo las actividades activas (opcional, por defecto true)
 * @param user Usuario autenticado
 * @returns Catálogo de actividades
 * @throws {NotFoundException} Si la empresa no tiene actividades
 * 
 * 
 * 
*/
@Controller('actividades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActividadController {
  constructor(private readonly actividadService: ActividadService) { }

  // ====================================================================
  //  RUTAS EXCLUSIVAS PARA ADMINISTRADORES
  // ====================================================================
  /**
   *  //  Crear actividad
   * Crea una nueva actividad para la empresa del usuario autenticado
   * Solo puede ser accedido por administradores
   * @param createActividadDto Datos de la actividad a crear
   * @param user Usuario autenticado
   * @returns Actividad creada
   * @throws {BadRequestException} Si los datos de la actividad son inválidos
   * 
   * 
   */
  @Post('crear')
  @Roles(UserRole.ADMIN)
  create(@Body() createActividadDto: CreateActividadDto, @GetUser() user: UserPayload) {
    return this.actividadService.create(user, createActividadDto);
  }

  //  Editar actividad por ID
  // Edita la actividad con el ID especificado
  // Solo puede ser accedido por administradores
  /**
   *  Edita la actividad con el ID especificado
   * @param id ID de la actividad a editar
   * @param user Usuario autenticado
   * @param updateActividadDto Datos de la actividad a editar
   * @returns Actividad editada
   * @throws {NotFoundException} Si la actividad no existe
   * @throws {BadRequestException} Si los datos de la actividad son inválidos
   * 
   * 
   */
  @Put('editar/:id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateActividadDto: UpdateActivityDto,
    @GetUser() user: UserPayload
  ) {
    return this.actividadService.update(id, user, updateActividadDto);
  }
  // =====================================================================
  //  RUTAS EXCLUSIVAS PARA EMPRESAS
  // ====================================================================

  //============================================

  //  Desactivar actividad por ID
  // Desactiva la actividad con el ID especificado
  // Solo puede ser accedido por administradores
  /**
   *  Desactiva la actividad con el ID especificado
   * @param id ID de la actividad a desactivar
   * @param user Usuario autenticado
   * @returns Actividad desactivada
   * @throws {NotFoundException} Si la actividad no existe
   * @throws {BadRequestException} Si la actividad ya está desactivada
   * 
   * 
   */
  @Delete('delete/:id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: UserPayload) {
    return this.actividadService.remove(id, user.empresaId);
  }

  // ====================================================================
  //  ADMIN Y  TRABAJADORES (Consultas)
  // ====================================================================


  /**
   *  //  Catalogo de actividades por empresa
     Si el usuario es trabajador, solo verá las actividades activas
     Si el usuario es admin, podrá ver todas las actividades o solo las activas según el parámetro
   * @param user Usuario autenticado
   * @param soloActivas Si se desea filtrar solo por actividades activas
   * @returns Catálogo de actividades por empresa
   * @throws {NotFoundException} Si la empresa no tiene actividades
   * @throws {NotFoundException} Si la empresa no tiene actividades activas
   * 
   * 
   */
  @Get('catalogo')
  @Roles(UserRole.ADMIN, UserRole.WORKER)
  findAll(
    @GetUser() user: UserPayload,
  ) {

    return this.actividadService.findAllByEmpresa(user);
  }


  /**
   * Devuelve la actividad con el ID especificado
   * Si el usuario es trabajador, solo podrá ver actividades activas
   * Si el usuario es admin, podrá ver todas las actividades
   * Si el usuario es trabajador y la actividad no está activa, devolverá un error  
   * 
   * @param id ID de la actividad a buscar
   * @param user Usuario autenticado
   * @returns Actividad con el ID especificado
   * @throws {NotFoundException} Si la actividad no existe o no está activa para el trabajador
   * 
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.WORKER)
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: UserPayload) {
    return this.actividadService.findOne(id, user);
  }
}