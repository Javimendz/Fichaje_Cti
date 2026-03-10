import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Put,
  ParseIntPipe,
  Injectable,
} from '@nestjs/common';

import { IssueService } from './issue.service';
import { CreateIncidenciaDto } from './dto/create-issue.dto';
import { UpdateIncidenciaDto } from './dto/update-issue.dto';

import { RolesGuard } from 'auth/guards/roles.guard';
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';
import { GetUser } from 'auth/decorators/get-user.decorator';
import { Roles } from 'auth/decorators/roles.decorator';
import { UserRole } from 'auth/roles.enum';
import type { UserPayload } from 'auth/interfaces/user-payload.interface';
/**
 *  Controlador para la gestión de incidencias
 * 
 * Este controlador proporciona las rutas necesarias para la gestión de incidencias,
 * como la creación, actualización, resolución y consulta de incidencias. 
 */
@Injectable()
@Controller('incidencias')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidenciaController {
  constructor(private readonly issueService: IssueService) {}

  // ===============================
  // TRABAJADOR
  // ===============================
  /**
   * 
   * Crea una nueva incidencia para el usuario autenticado.
   * 
   * @param dto Datos para crear la incidencia
   * @param user Usuario autenticado
   * @returns La incidencia creada
   */
  @Post('crear')
  @Roles(UserRole.WORKER, UserRole.ADMIN)
  create(
    @Body() dto: CreateIncidenciaDto,
    @GetUser() user: UserPayload,
  ) {
    return this.issueService.create(
      user.id,
      user.empresaId,
      dto,
    );
  }

  /**
   * 
   * Obtiene todas las incidencias creadas por el usuario autenticado.
   * 
   * @param user Usuario autenticado
   * @returns Lista de incidencias creadas por el usuario
   */
  @Get('mis-incidencias')
  @Roles(UserRole.WORKER, UserRole.ADMIN)
  findMine(@GetUser() user: UserPayload) {
    return this.issueService.findAllByUsuario(user.id);
  }

  // ===============================
  // ADMIN
  // ===============================

  /**
   * 
   * Obtiene todas las incidencias de la empresa autenticada.
   * 
   * @param user Usuario autenticado
   * @param pendientes Si se desea filtrar solo por incidencias pendientes
   * @returns Lista de incidencias de la empresa
   */
  @Get('empresa')
  @Roles(UserRole.ADMIN)
  findAllForAdmin(
    @GetUser() user: UserPayload,
    @Query('pendientes') pendientes?: string,
  ) {
    const soloPendientes = pendientes === 'true';

    return this.issueService.findAllByEmpresa(
      user.empresaId,
      soloPendientes,
    );
  }

  /**
   * 
   * Resuelve una incidencia de la empresa autenticada.
   * 
   * @param id ID de la incidencia a resolver
   * @param user Usuario autenticado
   * @returns La incidencia resuelta
   */
  @Put('resolver/:id')
  @Roles(UserRole.ADMIN)
  resolver(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIncidenciaDto,
    @GetUser() user: UserPayload,
  ) {
    return this.issueService.resolver(id, user.empresaId, dto);
  }

  /**
   * 
   * Actualiza/Edita una incidencia de la empresa autenticada.
   * 
   * @param id ID de la incidencia a actualizar
   * @param dto Datos para actualizar la incidencia
   * @param user Usuario autenticado
   * @returns La incidencia actualizada
   */
  @Put('edit-incidencia/:id')
  @Roles(UserRole.ADMIN, UserRole.WORKER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIncidenciaDto,
    @GetUser() user: UserPayload,
  ) {
    return this.issueService.update(id, user.empresaId, dto);
  }

  /**
   * 
   * Elimina una incidencia de la empresa autenticada.
   * 
   * @param id ID de la incidencia a eliminar
   * @param user Usuario autenticado
   * @returns La incidencia eliminada
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: UserPayload,
  ) {
    return this.issueService.remove(id, user.empresaId);
  }

  /**
   * 
   * Obtiene todas las incidencias ocultas de la empresa autenticada.
   * 
   * @param user Usuario autenticado
   * @returns Lista de incidencias ocultas de la empresa
   * 
   */
  @Get('ocultas')
  @Roles(UserRole.ADMIN, UserRole.WORKER)
  async getOcultas(@GetUser() user: UserPayload) {
    return await this.issueService.getOcultas(user.empresaId);
  }

}
