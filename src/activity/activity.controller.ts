import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
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

@Controller('actividades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActividadController {
  constructor(private readonly actividadService: ActividadService) {}

  // ====================================================================
  //  RUTAS EXCLUSIVAS PARA ADMINISTRADORES
  // ====================================================================

  @Post('crear')
  @Roles(UserRole.ADMIN)
  create(@Body() createActividadDto: CreateActividadDto, @GetUser() user: UserPayload) {
    return this.actividadService.create(user.empresaId, createActividadDto);
  }

  @Patch('editar/:id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateActividadDto: UpdateActivityDto,
    @GetUser() user: UserPayload
  ) {
    return this.actividadService.update(id, user.empresaId, updateActividadDto);
  }
  // =====================================================================
  //  RUTAS EXCLUSIVAS PARA EMPRESAS
  // ====================================================================

  //============================================
   
  
  @Patch('desactivar/:id')
  @Roles(UserRole.ADMIN)
  desactivar(@Param('id', ParseIntPipe) id: number, @GetUser() user: UserPayload) {
    return this.actividadService.desactivar(id, user.empresaId);
  }

  // ====================================================================
  //  ADMIN Y  TRABAJADORES (Consultas)
  // ====================================================================

  //  Catalogo de actividades por empresa
  // Si el usuario es trabajador, solo verá las actividades activas
  // Si el usuario es admin, podrá ver todas las actividades o solo las activas según el parámetro
   // fun   
  @Get('catalogo')
  @Roles(UserRole.ADMIN, UserRole.WORKER)
  findAll(
    @GetUser() user: UserPayload,
    @Query('soloActivas') soloActivas?: string // Permite ?soloActivas=true en la URL
  ) {
    // Si es un trabajador, forzamos a que solo vea las activas por seguridad
    const esTrabajador = user.rol === UserRole.WORKER;
    const filtrarActivas = esTrabajador ? true : soloActivas === 'true';

    return this.actividadService.findAllByEmpresa(user.empresaId, filtrarActivas);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: UserPayload) {
    return this.actividadService.findOne(id, user.empresaId);
  }
}