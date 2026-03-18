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
import type { UserPayload } from 'auth/interfaces/user-payload.interface'; 


// --- Controlador para la gestión de Trabajadores ---
/**
 * * WorkerController
 * * Gestiona el ciclo de vida de los trabajadores. La seguridad de "empresaId" y
 * * jerarquía de roles se delega al WorkerService para mantener el controlador limpio.
 * * Endpoints:
 * * - POST /worker/crear-worker: Crea un nuevo trabajador. Solo accesible por Admins de la empresa.
 * * - GET /worker/list-workers: Lista todos los trabajadores de la empresa. Solo accesible por Admins de la empresa.
 * * - GET /worker/find/:id: Busca un trabajador por ID. Solo accesible por Admins de la empresa.
 * * - PUT /worker/update/:id: Actualiza un trabajador por ID. Solo accesible por Admins de la empresa.
 * * - DELETE /worker/delete/:id: Elimina un trabajador por ID. Solo accesible por Admins de la empresa.
 * * - PUT /worker/assign-schedule/:workerId: Asigna un horario a un trabajador. Solo accesible por Admins de la empresa.
 * * El controlador delega toda la lógica de negocio y validación al WorkerService, manteniendo el controlador limpio y enfocado en manejar las solicitudes HTTP y la seguridad de acceso.
 */
@Controller('worker')
@UseGuards(JwtAuthGuard, RolesGuard) //  Aplica seguridad a todo el controlador
export class WorkerController {
  private readonly logger = new Logger(WorkerController.name);

  constructor(private readonly workerService: WorkerService) {}

  // --- CREAR: SOLO ADMIN ---
  /**
   * Endpoint para crear un nuevo trabajador. Solo accesible por Admins de la empresa.
   * El método delega toda la lógica de validación y creación al WorkerService, manteniendo el controlador limpio y enfocado en manejar la solicitud HTTP y la seguridad de acceso. El WorkerService se encargará de validar los datos, asignar el trabajador a la empresa del Admin, y garantizar que un Admin solo pueda crear trabajadores dentro de su propia empresa.
   * @param createWorkerDto DTO con los datos del trabajador a crear.
   * @param user Usuario autenticado que realiza la solicitud, utilizado para validar permisos y asignar empresaId al trabajador creado.
   * @return El trabajador creado. Si la creación falla por validación o permisos, se lanzará una excepción que será manejada por el WorkerService.
   * Este endpoint simplifica la creación de trabajadores, evitando la necesidad de tener endpoints separados para diferentes roles, y centraliza la lógica de creación en el WorkerService, lo que mejora la mantenibilidad y claridad del código.
   */
  @Post('crear-worker')
  @Roles(UserRole.ADMIN)
  create(
    @Body() createWorkerDto: CreateWorkerDto,
    @GetUser() user: UserPayload 
  ) {
    this.validateEmpresa(user);
    this.logger.log(`[Audit] Admin ${user.email} creando trabajador.`);
    return this.workerService.create(createWorkerDto, user);
  }

  // --- LISTAR: ADMIN  ---
  /**
   * 
   * @param user Usuario autenticado que realiza la solicitud, utilizado para validar permisos y determinar qué trabajadores mostrar (solo los de su empresa).
     * @returns Lista de trabajadores a los que el usuario tiene acceso (todos para SuperAdmin, solo los de su empresa para Admin).
     * Este endpoint permite a los Admins listar los trabajadores de su empresa, mientras que un SuperAdmin podría listar todos los trabajadores de todas las empresas. La lógica de filtrado se delega al WorkerService, manteniendo el controlador limpio y enfocado en manejar la solicitud HTTP y la seguridad de acceso.
     * Nota: Si quieres permitir que un SuperAdmin vea todos los trabajadores, puedes agregar una condición para verificar el rol del usuario y llamar a un método diferente en el WorkerService que devuelva todos los trabajadores sin filtrar por empresa.
     * Si decides permitir que un SuperAdmin vea todos los trabajadores, el método podría verse así:
     * if (user.rol === UserRole.SUPERADMIN) {
     *   return this.workerService.findAll();
   */ 
 
  @Get('list-workers')
  @Roles(UserRole.ADMIN)
  findAll(@GetUser() user: UserPayload) {
    
    // Si es SuperAdmin, ve todo el sistema
    if (user.rol === UserRole.SUPERADMIN) {
      throw new UnauthorizedException('SuperAdmin no tiene acceso a esta sección. Para gestionar trabajadores, debes ser Admin de una empresa específica.');
    }

    // Si es Admin normal, solo ve su empresa
    this.validateEmpresa(user);

    if (!user.empresaId) {
      throw new UnauthorizedException('Usuario sin empresa asignada');
    }
    return this.workerService.findAllByEmpresa(user.empresaId);
  }

  // --- BUSCAR UNO: ADMIN  ---
  /**
   * 
   * @param id  ID del trabajador a obtener. Se valida que sea un número entero mediante ParseIntPipe.
   * @param user    Usuario autenticado que realiza la solicitud, utilizado para validar permisos y determinar si tiene acceso al trabajador solicitado (solo si pertenece a su empresa).
   * @returns El trabajador solicitado si el usuario tiene permisos para accederlo.
   * Este endpoint permite a los Admins obtener información de un trabajador específico dentro de su empresa. La lógica de validación y obtención del trabajador se delega al WorkerService, manteniendo el controlador limpio y enfocado en manejar la solicitud HTTP y la seguridad de acceso. Si el trabajador no existe o el usuario no tiene acceso a él, se lanzará una excepción que será manejada por el WorkerService.
   * Nota: Si quieres permitir que un SuperAdmin vea cualquier trabajador por ID, puedes agregar una condición para verificar el rol del usuario y llamar a un método diferente en el WorkerService que devuelva el trabajador sin validar la empresa.
   * Si decides permitir que un SuperAdmin vea cualquier trabajador por ID, el método podría verse así:
   * if (user.rol === UserRole.SUPERADMIN) {
   */
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
  /**
   * 
   * @param id     ID del trabajador a actualizar. Se valida que sea un número entero mediante ParseIntPipe.  
   * @param updateWorkerDto DTO con los datos a actualizar del trabajador. Puede incluir campos como nombre, email, etc.
   * @param user  Usuario autenticado que realiza la solicitud, utilizado para validar permisos y determinar si tiene acceso al trabajador a actualizar (solo si pertenece a su empresa).
   * @returns El trabajador actualizado. Si el trabajador no existe, el usuario no tiene acceso a él, o la actualización falla por validación o permisos, se lanzará una excepción que será manejada por el WorkerService.
   * Este endpoint permite a los Admins actualizar la información de un trabajador específico dentro de su empresa. La lógica de validación y actualización del trabajador se delega al WorkerService, manteniendo el controlador limpio y enfocado en manejar la solicitud HTTP y la seguridad de acceso. Si el trabajador no existe o el usuario no tiene acceso a él, se lanzará una excepción que será manejada por el WorkerService.
   * Nota: Si quieres permitir que un SuperAdmin actualice cualquier trabajador por ID, puedes agregar una condición para verificar el rol del usuario y llamar a un método diferente en el WorkerService que actualice el trabajador sin validar la empresa.
   * Si decides permitir que un SuperAdmin actualice cualquier trabajador por ID, el método podría verse así:     
   * if (user.rol === UserRole.SUPERADMIN) {
   */
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
  /**
   * 
   * @param id    ID del trabajador a eliminar. Se valida que sea un número entero mediante ParseIntPipe.
   * @param user Usuario autenticado que realiza la solicitud, utilizado para validar permisos y determinar si tiene acceso al trabajador a eliminar (solo si pertenece a su empresa).
   * @returns Resultado de la operación de eliminación. Si el trabajador no existe, el usuario no tiene acceso a él, o la eliminación falla por permisos, se lanzará una excepción que será manejada por el WorkerService.
   * Este endpoint permite a los Admins eliminar un trabajador específico dentro de su empresa. La lógica de validación y eliminación del trabajador se delega al WorkerService, manteniendo el controlador limpio y enfocado en manejar la solicitud HTTP y la seguridad de acceso. Si el trabajador no existe o el usuario no tiene acceso a él, se lanzará una excepción que será manejada por el WorkerService.
   * Nota: Si quieres permitir que un SuperAdmin elimine cualquier trabajador por ID, puedes agregar una condición para verificar el rol del usuario y llamar a un método diferente en el WorkerService que elimine el trabajador sin validar la empresa.
   * Si decides permitir que un SuperAdmin elimine cualquier trabajador por ID, el método podría verse así:
   * if (user.rol === UserRole.SUPERADMIN) {
   */
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
 /**
  * 
  * @param workerId  ID del trabajador al que se le asignará el horario. Se valida que sea un número entero mediante ParseIntPipe.
  * @param horarioId ID del horario a asignar al trabajador. Se valida que sea un número entero mediante ParseIntPipe.
  * @param user Usuario autenticado que realiza la solicitud, utilizado para validar permisos y determinar si tiene acceso al trabajador al que se le asignará el horario (solo si pertenece a su empresa).
  * @returns Resultado de la operación de asignación. Si el trabajador o el horario no existen, el usuario no tiene acceso a ellos, o la asignación falla por validación o permisos, se lanzará una excepción que será manejada por el WorkerService.
  * Este endpoint permite a los Admins asignar un horario específico a un trabajador dentro de su empresa. La lógica de validación y asignación del horario se delega al WorkerService, manteniendo el controlador limpio y enfocado en manejar la solicitud HTTP y la seguridad de acceso. Si el trabajador o el horario no existen, o el usuario no tiene acceso a ellos, se lanzará una excepción que será manejada por el WorkerService.
  * Nota: Si quieres permitir que un SuperAdmin asigne horarios a cualquier trabajador por ID, puedes agregar una condición para verificar el rol del usuario y llamar a un método diferente en el WorkerService que asigne el horario sin validar la empresa.
  * Si decides permitir que un SuperAdmin asigne horarios a cualquier trabajador por ID, el método podría verse así:
  * if (user.rol === UserRole.SUPERADMIN) {
  */
  @Put('assign-schedule/:workerId')
  @Roles(UserRole.ADMIN) 
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
  /**
   * 
   * @param user Usuario autenticado que realiza la solicitud, utilizado para validar que tiene una empresa asignada (si no es SuperAdmin) antes de permitirle realizar acciones relacionadas con trabajadores.
   * @returns void. Si el usuario no tiene una empresa asignada y no es SuperAdmin, se lanzará una excepción que bloqueará la acción.
   * Este método privado se utiliza para validar que un usuario tiene una empresa asignada antes de permitirle realizar acciones relacionadas con trabajadores. Si el usuario es un SuperAdmin, no se requiere una empresa asignada, ya que tienen acceso a todo el sistema. Sin embargo, si el usuario es un Admin normal, debe tener una empresa asignada para poder gestionar los trabajadores de esa empresa. Si el usuario no cumple con esta condición, se lanzará una excepción de UnauthorizedException que bloqueará la acción y proporcionará un mensaje claro sobre la razón del bloqueo.  
   * Este método ayuda a centralizar la lógica de validación de la empresa, evitando la repetición de código en cada endpoint y asegurando que todas las acciones relacionadas con trabajadores estén protegidas por esta validación de manera consistente.
   * Nota: Si en el futuro decides permitir que un SuperAdmin realice acciones relacionadas con trabajadores sin necesidad de una empresa asignada, este método seguirá funcionando correctamente, ya que solo bloquea a los usuarios que no son SuperAdmin y no tienen una empresa asignada. Esto proporciona flexibilidad para futuras modificaciones en la lógica de roles y permisos sin necesidad de cambiar esta función de validación.
   */
  private validateEmpresa(user: UserPayload) {
    // Si no es SuperAdmin y no tiene empresa, bloqueamos
    if (user.rol !== UserRole.SUPERADMIN && !user.empresaId) {
      throw new UnauthorizedException('Usuario sin empresa asignada para realizar esta acción');
    }
  }
}