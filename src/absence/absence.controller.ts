import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, BadRequestException, ParseEnumPipe, Put } from '@nestjs/common';
import { CreateAbsenceDto } from './dto/create-absence.dto';
import { AbsenceService } from './absence.service';
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';
import { RolesGuard } from 'auth/guards/roles.guard'; 
import { Roles } from 'auth/decorators/roles.decorator'; 
import { GetUser } from 'auth/decorators/get-user.decorator';
import { User } from 'auth/entities/user.entity';
import { UserRole } from 'auth/roles.enum';
import { UpdateAbsenceDto } from './dto/update-absence.dto';
import { AusenciaEstado } from './dto/ausencia-estado.enum';


// 🟢 AbsenceController
// Controlador para gestionar las ausencias de los trabajadores.
// Permite a los trabajadores crear, actualizar, listar y eliminar sus ausencias, y a los administradores revisar todas las ausencias de su empresa y cambiar el estado de las solicitudes de ausencia.
/**
 * AbsenceController
 * Controlador para gestionar las ausencias de los trabajadores. Permite a los trabajadores crear, actualizar, listar y eliminar sus ausencias, y a los administradores revisar todas las ausencias de su empresa y cambiar el estado de las solicitudes de ausencia.
 * Endpoints:
 * - POST /ausencias/crear-ausencia: Permite a un trabajador crear una nueva solicitud de ausencia.
 * - GET /ausencias/mis-ausencias: Permite a un trabajador listar todas sus solicitudes de ausencia.
 * - GET /ausencias/list-ausencias: Permite a un administrador listar todas las solicitudes de ausencia de su empresa.
 * - GET /ausencias/find/:id: Permite a un trabajador o administrador ver los detalles de una solicitud de ausencia específica por su ID.
 * - DELETE /ausencias/delete/:id: Permite a un trabajador o administrador eliminar una solicitud de ausencia específica por su ID.
 * - PATCH /ausencias/update/:id: Permite a un trabajador o administrador actualizar los detalles de una solicitud de ausencia específica por su ID.
 * - PUT /ausencias/estado/:id: Permite a un administrador cambiar el estado de una solicitud de ausencia específica por su ID (PENDIENTE, APROBADA o RECHAZADA).
 * Utiliza guards para proteger los endpoints y asegurar que solo usuarios autenticados con los roles adecuados puedan acceder a ellos.
 * 
 */
@Controller('ausencias')
@UseGuards(JwtAuthGuard, RolesGuard) 
export class AbsenceController {
  constructor(private readonly ausenciaService: AbsenceService) {}


  // Endpoint para que un trabajador cree una nueva solicitud de ausencia.
  /* El trabajador proporciona el tipo de ausencia, motivo, fecha de inicio y fecha de fin a través del DTO CreateAbsenceDto. El sistema vincula automáticamente la solicitud con el ID del usuario autenticado. Solo los usuarios con rol ADMIN o WORKER pueden acceder a este endpoint para crear solicitudes de ausencia, excluyendo a los superadministradores que no deberían tener esta función.
    Ejemplo de payload: 
    {
  "tipo": "VACACIONES",
  "motivo": "Vacaciones anuales",
  "fechaInicio": "2024-07-01",
  "fechaFin": "2024-07-10"
  } 
    @Roles(UserRole.ADMIN, UserRole.WORKER) asegura que solo los trabajadores y administradores puedan crear solicitudes de ausencia, excluyendo a los superadministradores que no deberían tener esta función.
  */
  @Post('crear-ausencia')
  @Roles(UserRole.ADMIN, UserRole.WORKER) 
  create(@Body() createAusenciaDto: CreateAbsenceDto, @GetUser() user: User) {
    return this.ausenciaService.create(createAusenciaDto, user);
  }


  

  // Endpoint para que un trabajador vea su propio historial de ausencias.
  /* El sistema devuelve todas las solicitudes de ausencia registradas por el usuario autenticado, ordenadas por fecha de inicio (más reciente primero). Solo los usuarios con rol ADMIN o WORKER pueden acceder a este endpoint para ver su historial de ausencias, lo cual es útil para que los administradores también puedan revisar sus propias solicitudes de ausencia.
    @Roles(UserRole.ADMIN, UserRole.WORKER) permite que tanto los trabajadores como los administradores puedan revisar su historial personal de ausencias, lo cual es útil para que los administradores también puedan verificar sus propias solicitudes de ausencia.
  */
  @Get('mis-ausencias')
  @Roles(UserRole.ADMIN, UserRole.WORKER) 
  findMyAusencias(@GetUser() user: User) {
    return this.ausenciaService.findAllByUsuario(user.id);
  }

  // Endpoint para que un administrador vea todas las solicitudes de ausencia de su empresa.
  /* El sistema devuelve todas las solicitudes de ausencia registradas por los trabajadores de la empresa del administrador autenticado, ordenadas por fecha de inicio (más reciente primero) y con información del usuario que realizó cada solicitud. Solo los usuarios con rol ADMIN pueden acceder a este endpoint para revisar las solicitudes de ausencia de su empresa, lo cual es esencial para que los administradores puedan gestionar las ausencias de sus trabajadores.
    @Roles(UserRole.ADMIN) asegura que solo los administradores puedan revisar las solicitudes de ausencia de su empresa, lo cual es esencial para que los administradores puedan gestionar las ausencias de sus trabajadores.
  */  
  @Get('list-ausencias')
  @Roles(UserRole.ADMIN) 
  findAllByEmpresa(@GetUser() admin: User) {
    if (!admin.empresaId) {
      throw new BadRequestException('El administrador no tiene una empresa asignada.');
    }
    return this.ausenciaService.findAllByEmpresa(admin.empresaId);
  }
 
  // Endpoint para que un trabajador o administrador vea los detalles de una solicitud de ausencia específica por su ID.
  /* El sistema devuelve los detalles de la solicitud de ausencia especificada por su ID, siempre y cuando el usuario autenticado sea el propietario de la solicitud o un administrador de la empresa del propietario. Solo los usuarios con rol ADMIN o WORKER pueden acceder a este endpoint para ver los detalles de una solicitud de ausencia específica, lo cual es útil para que los administradores puedan revisar las solicitudes de ausencia de sus trabajadores.
    @Roles(UserRole.ADMIN, UserRole.WORKER) permite que tanto los trabajadores como los administradores puedan ver los detalles de una solicitud de ausencia específica, lo cual es útil para que los administradores puedan revisar las solicitudes de ausencia de sus trabajadores.
  */  
  @Get('find/:id')
  @Roles(UserRole.ADMIN, UserRole.WORKER) 
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.ausenciaService.findOne(id, user);
  }

  // Endpoint para que un trabajador o administrador elimine una solicitud de ausencia específica por su ID.
  /* El sistema elimina la solicitud de ausencia especificada por su ID, siempre y cuando el usuario autenticado sea el propietario de la solicitud o un administrador de la empresa del propietario. Solo los usuarios con rol ADMIN o WORKER pueden acceder a este endpoint para eliminar una solicitud de ausencia específica, lo cual es útil para que los administradores puedan gestionar las solicitudes de ausencia de sus trabajadores.
    @Roles(UserRole.ADMIN, UserRole.WORKER) permite que tanto los trabajadores como los administradores puedan eliminar una solicitud de ausencia específica, lo cual es útil para que los administradores puedan gestionar las solicitudes de ausencia de sus trabajadores.
  */
 @Delete('delete/:id')
  @Roles(UserRole.ADMIN, UserRole.WORKER) 
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.ausenciaService.remove(id, user);
  }
  // Endpoint para que un trabajador o administrador actualice los detalles de una solicitud de ausencia específica por su ID.
  /* El sistema actualiza los detalles de la solicitud de ausencia especificada por su ID, siempre y cuando el usuario autenticado sea el propietario de la solicitud o un administrador de la empresa del propietario. Solo los usuarios con rol ADMIN o WORKER pueden acceder a este endpoint para actualizar una solicitud de ausencia específica, lo cual es útil para que los administradores puedan gestionar las solicitudes de ausencia de sus trabajadores.
    @Roles(UserRole.ADMIN, UserRole.WORKER) permite que tanto los trabajadores como los administradores puedan actualizar una solicitud de ausencia específica, lo cual es útil para que los administradores puedan gestionar las solicitudes de ausencia de sus trabajadores.
  */
  @Put('update/:id')
  @Roles(UserRole.ADMIN, UserRole.WORKER) 
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAbsenceDto: UpdateAbsenceDto,
    @GetUser() user: User
  ) {
    return this.ausenciaService.update(id, updateAbsenceDto, user);
  }

  // Endpoint para que un administrador cambie el estado de una solicitud de ausencia específica por su ID (PENDIENTE, APROBADA o RECHAZADA).
  /* El sistema actualiza el estado de la solicitud de ausencia especificada por su ID, siempre y cuando el usuario autenticado sea un administrador de la empresa del propietario de la solicitud. Solo los usuarios con rol ADMIN pueden acceder a este endpoint para cambiar el estado de una solicitud de ausencia específica, lo cual es esencial para que los administradores puedan gestionar las solicitudes de ausencia de sus trabajadores.
    @Roles(UserRole.ADMIN) garantiza que solo los administradores puedan acceder a este endpoint para cambiar el estado de una solicitud de ausencia específica, lo cual es esencial para que los administradores puedan gestionar las solicitudes de ausencia de sus trabajadores.
  */
  @Put('estado/:id')
  @Roles(UserRole.ADMIN) 
  async updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado', new ParseEnumPipe(AusenciaEstado, {
      errorHttpStatusCode: 400,
      exceptionFactory: () => new BadRequestException(`Valor inválido. Use: PENDIENTE, APROBADA o RECHAZADA`)
    })) estado: AusenciaEstado,    
    @GetUser() admin: User 
  ) {
    return this.ausenciaService.updateEstado(id, estado, admin);
  }

  // Endpoint para que un trabajador vea su saldo de días de vacaciones disponibles.
  /* El sistema calcula y devuelve el saldo de días de vacaciones disponibles para el usuario autenticado, teniendo en cuenta las ausencias de tipo VACACIONES que ha registrado y su estado (PENDIENTE o APROBADA). Solo los usuarios con rol ADMIN o WORKER pueden acceder a este endpoint para ver su saldo de días de vacaciones, lo cual es útil para que los administradores también puedan revisar su propio saldo de vacaciones.
    @Roles(UserRole.ADMIN, UserRole.WORKER) permite que tanto los trabajadores como los administradores puedan ver su saldo de días de vacaciones disponibles, lo cual es útil para que los administradores también puedan revisar su propio saldo de vacaciones.
  */
  @Get('balance')
  @Roles(UserRole.ADMIN, UserRole.WORKER) 
  getVacationBalance(@GetUser() user: User) {
    return this.ausenciaService.getVacationBalance(user.id);
  }
}