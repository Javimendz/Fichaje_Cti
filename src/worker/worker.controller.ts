import { 
  Controller, Get, Post, Body, Param, Delete, Put, 
  UseGuards, UnauthorizedException, ParseIntPipe, Logger 
} from '@nestjs/common';
import { WorkerService } from './worker.service';
import { CreateWorkerDto } from './dto/worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';

// Auth & Roles Imports
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';
import { RolesGuard } from 'auth/guards/roles.guard';
import { Roles } from 'auth/decorators/roles.decorator';
import { UserRole } from 'auth/roles.enum';
import { GetUser } from 'auth/decorators/get-user.decorator';
// 👇 Importante: Usamos 'import type' para la interfaz ligera
import type { UserPayload } from 'auth/interfaces/user-payload.interface'; 

@Controller('worker')
@UseGuards(JwtAuthGuard, RolesGuard) //  Aplica seguridad a todo el controlador
export class WorkerController {
  private readonly logger = new Logger(WorkerController.name);

  constructor(private readonly workerService: WorkerService) {}

  // --- CREAR: SOLO ADMIN ---
  @Post('crear-worker')
  @Roles(UserRole.ADMIN)
  create(
    @Body() createWorkerDto: CreateWorkerDto,
    @GetUser() user: UserPayload //  Corregido: Recibe UserPayload
  ) {
    this.validateEmpresa(user);
    this.logger.log(`[Audit] Admin ${user.email} creando trabajador.`);
    // Pasamos el payload al servicio, que ya sabe manejar UserPayload
    return this.workerService.create(createWorkerDto, user);
  }

  // --- LISTAR: ADMIN Y SUPERADMIN ---
  @Get('list-workers')
  @Roles(UserRole.ADMIN)
  findAll(@GetUser() user: UserPayload) {
    
    // Si es SuperAdmin, ve todo el sistema
    if (user.rol === UserRole.SUPERADMIN) {
      return this.workerService.findAll();
    }

    // Si es Admin normal, solo ve su empresa
    this.validateEmpresa(user);

    if (!user.empresaId) {
      throw new UnauthorizedException('Usuario sin empresa asignada');
    }
    return this.workerService.findAllByEmpresa(user.empresaId);
  }

  // --- BUSCAR UNO: ADMIN Y SUPERADMIN ---
  @Get('find/:id')
  @Roles(UserRole.ADMIN)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: UserPayload
  ) {
    // El servicio se encarga de verificar que el ID pertenezca a la empresa del usuario
    return this.workerService.findOne(id, user);
  }

  // --- EDITAR: SOLO ADMIN ---
  @Put('update/:id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateWorkerDto: UpdateWorkerDto,
    @GetUser() user: UserPayload
  ) {
    this.validateEmpresa(user);
    // El servicio verificará la propiedad antes de actualizar
    return this.workerService.update(id, updateWorkerDto, user);
  }

  // --- BORRAR: SOLO ADMIN ---
  @Delete('delete/:id')
  @Roles(UserRole.ADMIN)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: UserPayload
  ) {
    this.validateEmpresa(user);
    this.logger.warn(`[Audit] Admin ${user.email} eliminando trabajador ID ${id}`);
    return this.workerService.remove(id, user);
  }

 // --- ASIGNAR HORARIO: SOLO ADMIN ---
  @Put('assign-schedule/:workerId')
  @Roles(UserRole.ADMIN) // 👈 Eliminamos SUPERADMIN
  async assignSchedule(
    @Param('workerId', ParseIntPipe) workerId: number,
    @Body('horarioId', ParseIntPipe) horarioId: number,
    @GetUser() user: UserPayload,
  ) {
    // Si es ADMIN, es obligatorio que tenga empresaId
    if (!user.empresaId) {
      throw new UnauthorizedException('No tienes una empresa asignada para gestionar horarios');
    }

    return await this.workerService.assignSchedule(
      workerId,
      horarioId,
      user
    );
  }
  // --- HELPER PRIVADO ---
  private validateEmpresa(user: UserPayload) {
    // Si no es SuperAdmin y no tiene empresa, bloqueamos
    if (user.rol !== UserRole.SUPERADMIN && !user.empresaId) {
      throw new UnauthorizedException('Usuario sin empresa asignada para realizar esta acción');
    }
  }
}