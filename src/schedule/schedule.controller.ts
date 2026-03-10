import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  UnauthorizedException,
  ParseIntPipe,
  Logger,
  UseInterceptors,
  ClassSerializerInterceptor,
  Put
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { CreateHorarioDto } from './dto/create-schedule.dto';
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';
import { RolesGuard } from 'auth/guards/roles.guard';
import { Roles } from 'auth/decorators/roles.decorator';
import { UserRole } from 'auth/roles.enum';
import type { UserPayload } from 'auth/interfaces/user-payload.interface'; 
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Controller('schedule')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor) 
export class ScheduleController {
  private readonly logger = new Logger(ScheduleController.name);

  constructor(private readonly schedulesService: ScheduleService) {}

  @Post('crear-schedule')
  @Roles(UserRole.ADMIN)
  create(
    @Body() dto: CreateHorarioDto,
    @GetUser() user: UserPayload,
  ) {
    // Obtenemos el ID validado (será number seguro)
    const empresaId = this.getEmpresaId(user);
    
    this.logger.log(`[Audit] Admin ${user.email} creando horario.`);
    return this.schedulesService.create(dto, user);
  }

  /**
   *  Busca todos los horarios activos de la empresa del usuario autenticado, incluyendo sus distribuciones y franjas. Solo los admins y workers pueden acceder a esta información.
   * @param user - Información del usuario autenticado, utilizada para validar la empresa a la que pertenecen los horarios
   *  
   * @return Lista de horarios con sus distribuciones y franjas, filtrados por la empresa del usuario
   * @throws UnauthorizedException si el usuario no tiene una empresa asignada
   * @throws NotFoundException si no se encuentran horarios para la empresa del usuario
   * @throws InternalServerErrorException si ocurre un error al acceder a la base de datos
   * 
   * Nota: Este método utiliza el helper privado getEmpresaId para validar que el usuario tiene una empresa asignada y obtener su ID. Luego, llama al servicio de horarios para buscar todos los horarios pertenecientes a esa empresa, incluyendo sus distribuciones y franjas. Además, se registra un log de auditoría cada vez que un admin o worker accede a la lista de horarios, incluyendo su email para rastrear quién está accediendo a esta información sensible.
   * Ejemplo de uso:
   * ```typescript
   * @Get('list-schedules')
   * @Roles(UserRole.ADMIN, UserRole.WORKER)
   * findAll(@GetUser() user: UserPayload) {
   *  const empresaId = this.getEmpresaId(user); // Validamos y obtenemos el ID de la empresa
   *  this.logger.log(`[Audit] ${user.rol} ${user.email} accediendo a la lista de horarios de la empresa ${empresaId}`);
   *  return this.schedulesService.findAllByEmpresa(empresaId); // Usamos el ID de la empresa para filtrar los horarios
   * }
   * ```
   
   */
  @Get('list-schedules')
  @Roles(UserRole.ADMIN, UserRole.WORKER)
  findAll(@GetUser() user: UserPayload) {
    const empresaId = this.getEmpresaId(user); 
    return this.schedulesService.findAllByEmpresa(empresaId); 
  }

  /**
   * 
   * Busca un horario por su ID asegurando que pertenezca a la empresa del usuario.
   * Si no se encuentra o no pertenece, lanza NotFoundException.
   * Si el usuario no tiene empresa asignada, lanza UnauthorizedException.
   * @returns El horario encontrado con sus distribuciones y franjas
   * 
    * Ejemplo de uso:
   * @Get('find/:id')
   * @Roles(UserRole.ADMIN, UserRole.WORKER)
   * findOne(
   *  @Param('id', ParseIntPipe) id: number,
   * @GetUser() user: UserPayload,
   * ) {
   *  const empresaId = this.getEmpresaId(user);
   *  return this.schedulesService.findOne(id, empresa
   * Id);
   * 
   */
  @Get('find/:id')
  @Roles(UserRole.ADMIN, UserRole.WORKER)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: UserPayload,
  ) {
    const empresaId = this.getEmpresaId(user);
    return this.schedulesService.findOne(id, empresaId);
  }

  /**
   * Elimina un horario por su ID, asegurando que el horario pertenece a la empresa del usuario autenticado. Solo los admins pueden realizar esta acción.
   * @param id - ID del horario a eliminar (debe ser un número entero)
   * @param user - Información del usuario autenticado, utilizada para validar la empresa a la que pertenece el horario
   * @return Un mensaje de éxito al eliminar el horario
   * @throws UnauthorizedException si el usuario no tiene una empresa asignada
   * @throws NotFoundException si el horario no existe o no pertenece a la empresa del usuario
   * @throws InternalServerErrorException si ocurre un error al eliminar el horario
   * 
   * Nota: Este método utiliza el helper privado getEmpresaId para validar que el usuario tiene una empresa asignada y obtener su ID. Luego, llama al servicio de horarios para eliminar el horario, pasando el ID del horario y el ID de la empresa para asegurar que solo se eliminen horarios pertenecientes a la empresa del usuario. Además, se registra un log de auditoría cada vez que un admin intenta eliminar un horario, incluyendo su email y el ID del horario que intenta eliminar.
   * Ejemplo de uso:
   * ```typescript
   * @Delete('delete/:id')
   * @Roles(UserRole.ADMIN)
   * remove(
   *  @Param('id', ParseIntPipe) id: number,
   * @GetUser() user: UserPayload,
   * ) {
   *  const empresaId = this.getEmpresaId(user);
   *  this.logger.warn(`[Audit] Admin ${user.email} eliminando horario ${id}`);
   *  return this.schedulesService.remove(id, empresaId);
   * }
   * ``` 
   */
  @Delete('delete/:id')
  @Roles(UserRole.ADMIN)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: UserPayload,
  ) {
    const empresaId = this.getEmpresaId(user);
    this.logger.warn(`[Audit] Admin ${user.email} eliminando horario ${id}`);
    return this.schedulesService.remove(id, empresaId);
  }

  

  
  /**
   * Obtiene el ID de la empresa del usuario autenticado. Si el usuario no tiene una empresa asignada, lanza una excepción de Unauthorized.
   * @param user - El payload del usuario autenticado, que debe incluir la propiedad empresaId.
   * @throws UnauthorizedException si el usuario no tiene una empresa asignada.
   * 
   * Nota: Este método es un helper privado para centralizar la validación de la empresa en los endpoints del controlador. De esta forma, evitamos repetir el mismo código de validación en cada método y garantizamos que todas las operaciones relacionadas con horarios estén protegidas por esta lógica de seguridad.
   * Ejemplo de uso:
   * ```typescript
   * @Get('list-schedules')
   * @Roles(UserRole.ADMIN, UserRole.WORKER)
   * findAll(@GetUser() user: UserPayload) {
   *  const empresaId = this.getEmpresaId(user); // Validamos y obtenemos el ID de la empresa
   * return this.schedulesService.findAllByEmpresa(empresaId); // Usamos el ID de la empresa para filtrar los horarios
   * }
   * ``` 
   */

        
  private getEmpresaId(user: UserPayload): number {
    if (!user.empresaId) {
      throw new UnauthorizedException('Usuario sin empresa asignada para realizar esta acción');
    }
    return user.empresaId;
  }

  
  @Put('editar/:id')
  @Roles(UserRole.ADMIN)
   update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScheduleDto, // Asegúrate de importar esto
    @GetUser() user: UserPayload,
  ) {
    const empresaId = this.getEmpresaId(user);
    this.logger.log(`[Audit] Admin ${user.email} actualizando horario ${id}`);
    
    // Llamamos al servicio (le pasamos 'user' completo porque el método update del servicio lo pide así)
    return this.schedulesService.update(id, dto, user);
  }


  /**
   * Obtiene las horas que el trabajador logueado DEBE trabajar (Objetivo)
   * GET /schedules/stats/objetivo
   */
  @Get('stats/objetivo')
  async getObjetivo(@GetUser() user: UserPayload) {
    return await this.schedulesService.getHorasObjetivoSemanal(user.id);
  }

  /**
   * Obtiene las horas que el trabajador lleva TRABAJADAS esta semana (Real)
   * GET /schedules/stats/real
   */
  @Get('stats/real')
  async getReal(@GetUser() user: UserPayload) {
    return await this.schedulesService.getHorasTrabajadasSemanales(user.id);
  }

  /**
   * Obtiene el porcentaje de cumplimiento semanal
   * GET /schedules/stats/progreso
   */
  @Get('stats/progreso')
  async getProgreso(@GetUser() user: UserPayload) {
    return await this.schedulesService.getProgresoSemanal(user.id);
  }

  /**
   * Endpoint para que un ADMIN consulte el progreso de cualquier trabajador
   * GET /schedules/stats/progreso/28
   */
  @Get('stats/progreso/:userId')
  async getProgresoById(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    // Aquí podrías añadir un Guard de Roles para que solo el ADMIN entre
    return await this.schedulesService.getProgresoSemanal(userId);
  }

}