import { Controller, Post, Get, Body, Param, UseGuards, ParseIntPipe, Put, Delete, Req } from '@nestjs/common';
import { SiteService } from './site.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Tu guard de JWT
import { GetUser } from '../auth/decorators/get-user.decorator'; // Decorador personalizado
import type { UserPayload } from '../auth/interfaces/user-payload.interface';
import { CheckInSiteDto } from './dto/checkInSite.dto';
import { CheckOutSiteDto } from './dto/checkOutSite.dto';
import { CreateSiteIssueDto } from './dto/createSiteIssue.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/roles.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AssignWorkerDto } from './dto/assign-worker.dto';

@Controller('sites')
// 🚩 Ponemos AMBOS Guards a nivel de controlador. Se ejecutan en orden: primero el Token, luego el Rol.
@UseGuards(JwtAuthGuard, RolesGuard)
export class SiteController {
  constructor(private readonly siteService: SiteService) { }


  @Get('calendar/me/:year/:month')
  // @UseGuards(JwtAuthGuard) // Activa tu guard de seguridad
  async getMySiteCalendar(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @Req() req: any
  ) {
    const userPayload = req.user; // Tu payload del JWT
    return await this.siteService.getMonthlyCalendar(userPayload.id, year, month);
  }

  // 2. Calendario de obras para el Administrador (ve las horas de un trabajador)
  @Get('calendar/admin/:workerId/:year/:month')
  // @UseGuards(JwtAuthGuard, RolesGuard) // Activar guards de admin
  async getWorkerSiteCalendar(
    @Param('workerId', ParseIntPipe) workerId: number,
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @Req() req: any
  ) {
    const adminPayload = req.user; 
    return await this.siteService.getWorkerMonthlyCalendarForAdmin(
      workerId, 
      adminPayload.empresaId, 
      year, 
      month
    );
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: UserPayload
  ) {
    return await this.siteService.findOne(id, user);
  }

  @Get('worker/list')
  @Roles(UserRole.WORKER, UserRole.ADMIN) // Permitimos a ambos
  async getMySites(@GetUser() user: UserPayload) {
    // Extraemos el ID del token (user.id)
    return await this.siteService.getSitesForWorker(user.id);
  }

@Get('admin/worker-sites/:workerId')
@Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
async getSitesForWorkerByAdmin(
  @Param('workerId', ParseIntPipe) workerId: number,
  @GetUser() admin: UserPayload // Obtenemos el admin para validar la empresa
) {
  return await this.siteService.getSitesForWorkerByAdmin(workerId, admin);
}
  
  @Post('assign-worker')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async assignWorker(
    @Body() dto: AssignWorkerDto,
    @GetUser() admin: UserPayload
  ) {
    return await this.siteService.assignWorker(dto, admin);
  }

  @Get('active-site')
  @Roles(UserRole.WORKER, UserRole.ADMIN) // Permitimos a ambos
  async getActiveSite(@GetUser() user: UserPayload) {
    // Usamos el ID del usuario que viene en el Token JWT
    return await this.siteService.getActiveSiteForWorker(user.id);
  }

  // ELIMINAR OBRA (Archivar)
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN) // 🔒 Solo jefes pueden borrar
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: UserPayload
  ) {
    return await this.siteService.remove(id, user);
  }
  // ==========================================
  // 🔒 SOLO ADMIN: Crear Obra
  // ==========================================
  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN) // 🚩 Etiqueta de seguridad
  create(@Body() dto: CreateSiteDto, @GetUser() user: UserPayload) {
    return this.siteService.create(dto, user);
  }

  // ==========================================
  // 🔒 SOLO ADMIN: Actualizar Obra
  // ==========================================
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN) // 🚩 Etiqueta de seguridad
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSiteDto: UpdateSiteDto,
    @GetUser() admin: UserPayload
  ) {
    return await this.siteService.update(id, updateSiteDto, admin);
  }

  // ==========================================
  // 🟢 ABIERTO A TODOS: Listar Obras
  // ==========================================
  @Get()
  // Sin @Roles, el Guard deja pasar a cualquiera que tenga un Token válido (Admin o Trabajador)
  findAll(@GetUser() user: UserPayload) {
    return this.siteService.findAllSites(user.empresaId);
  }

  // ==========================================
  // 🟢 ABIERTO A TODOS (O solo workers): Fichajes e Incidencias
  // ==========================================
  @Post('check-in')
  @Roles(UserRole.WORKER, UserRole.ADMIN) // Permitimos a ambos por si un admin va a la obra
  checkIn(@Body() dto: CheckInSiteDto, @GetUser() user: UserPayload) {
    return this.siteService.checkIn(dto, user);
  }

  @Post('check-out/:id')
  @Roles(UserRole.WORKER, UserRole.ADMIN)
  checkOut(
    @Param('id', ParseIntPipe) logId: number,
    @Body() dto: CheckOutSiteDto,
    @GetUser() user: UserPayload
  ) {
    return this.siteService.checkOut(logId, dto, user.id);
  }

  @Post('incident')
  @Roles(UserRole.WORKER, UserRole.ADMIN)
  reportIncident(@Body() dto: CreateSiteIssueDto, @GetUser() user: UserPayload) {
    return this.siteService.reportIncident(dto, user);
  }
}