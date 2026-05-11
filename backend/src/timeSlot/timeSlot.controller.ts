import { 
  Controller, Get, Post, Body, Param, Delete, 
  UseGuards, ParseIntPipe, Put, UnauthorizedException, Logger 
} from '@nestjs/common';

import { TimeSlotService } from './timeSlot.service';
import { CreateTimeSlotDto } from './dto/create-timeSlot.dto';
import { UpdateTimeSlotDto } from './dto/update-timeSlot.dto';

// Auth & Roles Imports
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/roles.enum';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { UserPayload } from '../auth/interfaces/user-payload.interface'; 


// 🟢 TimeSlotController
// Controlador para gestionar las franjas horarias de los horarios de trabajo.
// Permite a los administradores crear, editar, eliminar y listar franjas horarias, y a los trabajadores listar y buscar franjas horarias específicas.
// Utiliza guards para proteger los endpoints y asegurar que solo usuarios autenticados con los roles adecuados puedan acceder a ellos.
/**
 * TimeSlotController
 * Controlador para gestionar las franjas horarias de los horarios de trabajo.
 * Permite a los administradores crear, editar, eliminar y listar franjas horarias, y a los trabajadores listar y buscar franjas horarias específicas.
 * Endpoints:
 * - POST /franja-horaria/crear: Permite a un administrador crear una nueva franja horaria.
 * - GET /franja-horaria/list-franja-horaria: Permite a administradores y trabajadores listar todas las franjas horarias de su empresa. 
 * - GET /franja-horaria/find/:id: Permite a administradores y trabajadores buscar una franja horaria específica por su ID.
 * - PUT /franja-horaria/update/:id: Permite a un administrador editar una franja horaria existente.
 * - DELETE /franja-horaria/delete/:id: Permite a un administrador eliminar una franja horaria existente.
 * - GET /franja-horaria/by-schedule/:scheduleId: Permite a administradores y trabajadores listar todas las franjas horarias asociadas a un horario específico.
 * Utiliza guards para proteger los endpoints y asegurar que solo usuarios autenticados con los roles adecuados puedan acceder a ellos.
 * 
 */ 
@Controller('franja-horaria')
@UseGuards(JwtAuthGuard, RolesGuard) 
export class TimeSlotController {
  private readonly logger = new Logger(TimeSlotController.name);

  constructor(private readonly franjaHorariaService: TimeSlotService) {}

  // --- CREAR: SOLO ADMIN ---
  // El endpoint de creación de franjas horarias es exclusivo para administradores, ya que la gestión de los horarios de trabajo es una función crítica que debe ser controlada para evitar conflictos y garantizar la coherencia en la planificación de los turnos. Al restringir esta acción a los administradores, se asegura que solo usuarios con el nivel adecuado de permisos puedan modificar la estructura de los horarios, lo que ayuda a mantener un entorno de trabajo organizado y eficiente.
  /* Endpoint para que un administrador cree una nueva franja horaria.  
    * El sistema valida que el 'distribucionDiaId' pertenezca a la empresa del usuario, que la hora de inicio sea menor a la hora de fin (si se proporciona), y que no haya solapamientos con otras franjas del mismo día antes de guardar la franja en la base de datos.
    * Solo los usuarios con rol ADMIN pueden acceder a este endpoint para crear franjas horarias, asegurando que la gestión de los horarios de trabajo esté controlada por personal autorizado y evitando que los trabajadores puedan modificar la estructura de los turnos, lo que podría generar conflictos y desorganización en la planificación.
    * Ejemplo de payload:
    * {
    "distribucionDiaId": 1,
    "inicio": "08:00",
    "fin": "16:00"
    }
    * El campo 'fin' es opcional, lo que permite crear franjas horarias que se extiendan hasta el final del día sin necesidad de especificar una hora de fin exacta.
    * @Roles(UserRole.ADMIN) garantiza que solo los administradores puedan acceder a este endpoint, manteniendo la seguridad y el control sobre la gestión de los horarios de trabajo en la empresa.
    */
  @Post('crear')
  @Roles(UserRole.ADMIN)
  create(
    @Body() createFranjaHorariaDto: CreateTimeSlotDto,
    @GetUser() user: UserPayload
  ) {
    this.validateEmpresa(user);
    // Pasamos el usuario para validar que el Schedule/Día pertenece a su empresa
    return this.franjaHorariaService.create(createFranjaHorariaDto, user);
  }

  // --- LISTAR: ADMIN Y WORKER ---
  // (Opcional: Filtrar por día o scheduleId suele ser más común que listar TODO)
  /* Endpoint para listar todas las franjas horarias de la empresa del usuario.
    * El sistema devuelve todas las franjas horarias asociadas a la empresa del usuario autenticado, ordenadas por hora de inicio (más temprano primero).
    * Solo los usuarios con rol ADMIN o WORKER pueden acceder a este endpoint para listar las franjas horarias, asegurando que los trabajadores puedan revisar las franjas de su empresa mientras se mantiene la seguridad y privacidad de los datos.
    * @Roles(UserRole.ADMIN, UserRole.WORKER) garantiza que tanto los administradores como los trabajadores puedan acceder a este endpoint, permitiendo a los trabajadores revisar las franjas de su empresa mientras se mantiene la seguridad y privacidad de los datos.
    */  
  @Get('list-franja-horaria')
  @Roles(UserRole.ADMIN, UserRole.WORKER)
  findAll(@GetUser() user: UserPayload) {
    this.validateEmpresa(user);
    return this.franjaHorariaService.findAll(user);
  }

  // --- BUSCAR UNO: ADMIN Y WORKER ---
  /* Endpoint para buscar una franja horaria específica por su ID.
    * El sistema devuelve la franja horaria que coincide con el ID proporcionado, siempre y cuando esté asociada a la empresa del usuario autenticado.
    * Solo los usuarios con rol ADMIN o WORKER pueden acceder a este endpoint para buscar una franja horaria específica, asegurando que los trabajadores puedan revisar las franjas de su empresa mientras se mantiene la seguridad y privacidad de los datos.
    * @Roles(UserRole.ADMIN, UserRole.WORKER) garantiza que tanto los administradores como los trabajadores puedan acceder a este endpoint, permitiendo a los trabajadores revisar las franjas de su empresa mientras se mantiene la seguridad y privacidad de los datos.
    * El parámetro :id en la ruta se utiliza para identificar la franja horaria específica que se desea consultar, lo que permite a los usuarios revisar fácilmente los detalles de cualquier franja dentro de su empresa.
    * El sistema valida que la franja horaria solicitada pertenezca a la empresa del usuario antes de devolverla, lo que garantiza que los usuarios solo puedan acceder a la información relevante para su empresa y se mantenga la seguridad de los datos.
    */
  @Get('find/:id')
  @Roles(UserRole.ADMIN, UserRole.WORKER)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: UserPayload
  ) {
    this.validateEmpresa(user);
    return this.franjaHorariaService.findOne(id, user);
  }

  // --- EDITAR: SOLO ADMIN ---
  /* Endpoint para editar una franja horaria existente.
    * El sistema valida que la franja horaria a editar pertenezca a la empresa del usuario, que la hora de inicio sea menor a la hora de fin (si se proporciona), y que no haya solapamientos con otras franjas del mismo día antes de guardar los cambios en la base de datos.
    * Solo los usuarios con rol ADMIN pueden acceder a este endpoint para editar franjas horarias, asegurando que la gestión de los horarios de trabajo esté controlada por personal autorizado y evitando que los trabajadores puedan modificar la estructura de los turnos, lo que podría generar conflictos y desorganización en la planificación.
    * Ejemplo de payload:
    * {
    "inicio": "09:00",
    "fin": "17:00"  
    }
    * El campo 'fin' es opcional, lo que permite modificar franjas horarias para que se extiendan hasta el final del día sin necesidad de especificar una hora de fin exacta.
    * @Roles(UserRole.ADMIN) garantiza que solo los administradores puedan acceder a este endpoint, manteniendo la seguridad y el control sobre la gestión de los horarios de trabajo en la empresa.
    */
  @Put('update/:id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateFranjaHorariaDto: UpdateTimeSlotDto,
    @GetUser() user: UserPayload
  ) {
    this.validateEmpresa(user);
    this.logger.log(`[Audit] Admin ${user.email} actualizando franja ${id}`);
    return this.franjaHorariaService.update(id, updateFranjaHorariaDto, user);
  }

  // --- BORRAR: SOLO ADMIN ---
  /* Endpoint para eliminar una franja horaria existente.
    * El sistema valida que la franja horaria a eliminar pertenezca a la empresa del usuario antes de eliminarla de la base de datos, lo que garantiza que los usuarios solo puedan modificar la información relevante para su empresa y se mantenga la seguridad de los datos.
    * Solo los usuarios con rol ADMIN pueden acceder a este endpoint para eliminar franjas horarias, asegurando que la gestión de los horarios de trabajo esté controlada por personal autorizado y evitando que los trabajadores puedan modificar la estructura de los turnos, lo que podría generar conflictos y desorganización en la planificación.
    * @Roles(UserRole.ADMIN) garantiza que solo los administradores puedan acceder a este endpoint, manteniendo la seguridad y el control sobre la gestión de los horarios de trabajo en la empresa.
    * El parámetro :id en la ruta se utiliza para identificar la franja horaria específica que se desea eliminar, lo que permite a los administradores gestionar fácilmente las franjas dentro de su empresa.
    * El sistema registra una entrada de auditoría cada vez que se elimina una franja horaria, incluyendo el correo electrónico del administrador que realizó la acción y el ID de la franja eliminada, lo que ayuda a mantener un historial de cambios y mejorar la trazabilidad de las acciones administrativas.
    */
  @Delete('delete/:id')
  @Roles(UserRole.ADMIN)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: UserPayload
  ) {
    this.validateEmpresa(user);
    this.logger.warn(`[Audit] Admin ${user.email} eliminando franja ${id}`);
    return this.franjaHorariaService.remove(id, user);
  }

  // --- HELPER PRIVADO ---
  /* Método privado para validar que el usuario tenga una empresa asignada antes de realizar cualquier acción relacionada con las franjas horarias.
    * Este método se llama al inicio de cada endpoint para asegurar que el usuario autenticado tenga una empresa asociada, lo que es fundamental para mantener la seguridad y la integridad de los datos, ya que todas las operaciones relacionadas con las franjas horarias deben estar vinculadas a una empresa específica.
    * Si el usuario no tiene una empresa asignada, se lanza una excepción UnauthorizedException, lo que impide que el usuario realice cualquier acción relacionada con las franjas horarias y protege la información de la empresa.
    */
  private validateEmpresa(user: UserPayload) {
    if (!user.empresaId) {
      throw new UnauthorizedException('Usuario sin empresa asignada');
    }
  }

// --- NUEVO ENDPOINT: Listar franjas por Schedule ---
/* Endpoint para listar todas las franjas horarias de un horario específico.
    * El sistema devuelve todas las franjas horarias asociadas al horario identificado por el ID proporcionado, ordenadas por hora de inicio (más temprano primero).
    * Solo los usuarios con rol ADMIN o WORKER pueden acceder a este endpoint para revisar las franjas horarias de un horario específico, asegurando que los trabajadores puedan ver las franjas de su horario pero no las de otros horarios o empresas.
    * @Roles(UserRole.ADMIN, UserRole.WORKER) garantiza que tanto los administradores como los trabajadores puedan acceder a este endpoint, permitiendo a los trabajadores revisar las franjas de su horario asignado mientras se mantiene la seguridad y privacidad de los datos.
    * El parámetro :scheduleId en la ruta se utiliza para identificar el horario específico cuyas franjas se desean consultar, lo que permite a los usuarios revisar fácilmente las franjas horarias asociadas a cualquier horario dentro de su empresa.
    */

@Get('by-schedule/:scheduleId')
@Roles(UserRole.ADMIN, UserRole.WORKER)
findAllBySchedule(
  @Param('scheduleId', ParseIntPipe) scheduleId: number,
  @GetUser() user: UserPayload
) {
  // En el servicio implementarías un filtro donde schedule.id = scheduleId
this.validateEmpresa(user);
    // Llamamos al servicio pasando el ID del horario Y el usuario (para seguridad)
    return this.franjaHorariaService.findAllBySchedule(scheduleId, user);}

}