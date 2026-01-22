import { Controller, Get, Post, Body, Param, Delete, ParseUUIDPipe, UseGuards, BadRequestException, UnauthorizedException, Patch } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
// Importar el servicio de horarios
import { SchedulesService } from './schedules.service';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../auth/entities/user.entity';
import { CreateHorarioDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { AllowedUserService } from 'allowed-user/allowed-user.service';
import { UserRole } from 'auth/roles.enum';
import { Roles } from 'auth/decorators/roles.decorator';

/**
 * SchedulesController
 * Controlador para la gestión de horarios en la aplicación.
 * Utiliza guardias de autenticación para proteger las rutas.
 * Proporciona endpoints para crear, listar, obtener y eliminar horarios.
 * Cada endpoint está protegido para garantizar
 * que solo los usuarios autorizados puedan acceder a ellos.
 * @see SchedulesService para la lógica de negocio relacionada con los horarios.
 * @controller 'schedules' define la ruta base para este controlador.
 * @UseGuards(AuthGuard()) aplica el guardia de autenticación a todas las rutas del controlador.  
 *  
 */
@Controller('schedules') // prefijo de ruta
@UseGuards(AuthGuard()) // Guards aplicados a todo el controlador
export class SchedulesController { // Inyección de dependencias
  constructor(
    private readonly schedulesService: SchedulesService, // Servicio de horarios
   private readonly allowedUserService: AllowedUserService, // Servicio de usuarios permitidos
  ) {}

  /**
   *  Crea un nuevo horario en el sistema.
   *  
   * @param createHorarioDto Datos del nuevo horario a crear.
   * @param user Usuario actual que realiza la solicitud, utilizado para asociar el horario a su empresa.
   * @returns El horario creado.
   * @throws UnauthorizedException si el usuario no tiene una empresa asociada.
   * 
   */
  @Post() // Endpoint para crear un nuevo horario
  create( // Crear nuevo horario
    @Body() createHorarioDto: CreateHorarioDto, // Cuerpo de la solicitud con los datos del horario
    @GetUser() user: User  // Usuario autenticado que realiza la solicitud
  ) {
    // Validación de seguridad para el modo estricto de TS
    if (!user.empresaId) {
      throw new UnauthorizedException('No tienes una empresa asociada para crear horarios');
    }
    // Pasamos el DTO y el ID ya validado como string
    return this.schedulesService.create(createHorarioDto, user);
  }

  /**
   *  Lista todos los horarios asociados a la empresa del usuario.
   * 
   * @param user Usuario actual que realiza la solicitud.
   * @returns Lista de horarios asociados a la empresa del usuario.
   * @throws BadRequestException si el usuario no tiene una empresa asignada.
   * 
   */
  @Get() // Endpoint para listar todos los horarios
  findAll(@GetUser() user: User) { // Listar horarios por empresa
    if (!user.empresaId) { // Validación de empresa
      throw new BadRequestException('Usuario sin empresa asignada'); // Error si no hay empresa
    }
    return this.schedulesService.findAllByEmpresa(user.empresaId); // Listar horarios
  }

  /**
   *  Obtiene un horario específico por su ID.
   * @param id ID del horario a obtener.
   * @param user Usuario actual que realiza la solicitud
   * @returns El horario solicitado.
   * @throws UnauthorizedException si el usuario no tiene una empresa asociada. 
   * 
   */
  @Get(':id') // Endpoint para obtener un horario por ID
  findOne(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) { // Obtener horario por ID
    if (!user.empresaId) throw new UnauthorizedException('Usuario sin empresa'); // Validación de empresa
    
    return this.schedulesService.findOne(id, user.empresaId); // Obtener el horario
  }

  /**
   *  Elimina un horario específico por su ID.
   *  
   * @param id ID del horario a eliminar.
   * @param user Usuario actual que realiza la solicitud.
   * @returns Resultado de la operación de eliminación.
   * @throws UnauthorizedException si el usuario no tiene una empresa asociada.
   * 
   */
  @Delete(':id') // Endpoint para eliminar un horario por ID
  remove(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) { // Eliminar horario por ID
    if (!user.empresaId) throw new UnauthorizedException('Usuario sin empresa'); // Validación de empresa
    
    return this.schedulesService.remove(id, user.empresaId); // Eliminar el horario
  }

  /**
   *  Asigna un horario a un usuario permitido.
   *  
   * @param userId ID del usuario al que se le asignará el horario.
   * @param dto Datos que contienen el ID del horario a asignar.
   * @param admin Usuario administrador que realiza la asignación.
   * @returns Resultado de la asignación del horario.
   * @throws UnauthorizedException si el administrador no tiene una empresa asignada.
   *  
   */
  @Patch(':id/assign-schedule') // Endpoint para asignar un horario a un usuario permitido
  @UseGuards(AuthGuard()) // Asegurar que el usuario esté autenticado
  async assignSchedule( // Asignar horario a usuario permitido
    @Param('id', ParseUUIDPipe) userId: string, // ID del usuario al que se le asignará el horario
    @Body() dto: UpdateScheduleDto, // Cuerpo de la solicitud con el ID del horario
    @GetUser() admin: User // Obtenemos el admin para sacar su empresaId
  ) {

    if(!admin.empresaId) { // Validación de empresa
      throw new UnauthorizedException('El administrador no tiene una empresa asignada'); // Error si no hay empresa
    }

    return await this.allowedUserService.assignSchedule( // Delegar la asignación al servicio de AllowedUser
      userId,  // ID del usuario
      dto.horarioId,  // ID del horario desde el DTO
      admin.empresaId // Empresa del admin
    );
  }

  /**
   *  Asigna un horario a un trabajador específico.
   *  
   * @param userId ID del trabajador al que se le asignará el horario.
   * @param horarioId ID del horario a asignar.
   * @param admin Usuario administrador que realiza la asignación.
   * @returns Resultado de la asignación del horario.
   * @throws BadRequestException si el administrador no tiene una empresa asignada.
   * 
   */
  @Patch(':userId/assign-worker') // Endpoint para asignar un horario a un trabajador
  @Roles(UserRole.ADMIN) // Solo accesible por ADMIN
  async assignWorkerToSchedule( // Asignar horario a trabajador
    @Param('userId', ParseUUIDPipe) userId: string, // ID del trabajador
    @Body('horarioId', ParseUUIDPipe) horarioId: string, // ID del horario desde el cuerpo
    @GetUser() admin: User, // Obtenemos el admin para sacar su empresaId
  ) {
    if (!admin.empresaId) throw new BadRequestException('Admin sin empresa'); // Validación de empresa
    
    // Delegar la asignación al servicio de AllowedUser
    return await this.allowedUserService.assignSchedule(userId, horarioId, admin.empresaId);
  }


}