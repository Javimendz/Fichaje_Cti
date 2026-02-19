// src/ausencias/ausencia.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, BadRequestException, Put } from '@nestjs/common';
import { CreateAbsenceDto } from './dto/create-absence.dto';
import { AbsenceService } from './absence.service';
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';
import { RolesGuard } from 'auth/guards/roles.guard'; 
import { Roles } from 'auth/decorators/roles.decorator'; 
import { GetUser } from 'auth/decorators/get-user.decorator';
import { User } from 'auth/entities/user.entity';
import { AusenciaEstado } from './entities/ausencia.entity';
import { UserRole } from 'auth/roles.enum';
import { UpdateAbsenceDto } from './dto/update-absence.dto';

// Controlador para gestionar las ausencias de los trabajadores
// Define la ruta base para este controlador y aplica los guards de autenticación y roles
// El controlador AbsenceController maneja las solicitudes HTTP relacionadas con las ausencias de los trabajadores. Incluye endpoints para crear una nueva ausencia, listar las ausencias del usuario autenticado, listar todas las ausencias de la empresa (solo para administradores), buscar una ausencia por su ID, eliminar una ausencia y actualizar el estado de una ausencia (solo para administradores). Cada endpoint está protegido por guards que verifican la autenticación JWT y los roles de usuario, asegurando que solo los usuarios autorizados puedan acceder a cada funcionalidad.
// @Controller('ausencia') define la ruta base para este controlador, lo que significa que todas las rutas definidas en este controlador estarán prefijadas con '/ausencia'.
// @UseGuards(JwtAuthGuard, RolesGuard) aplica los guards de autenticación JWT y validación de roles a todas las rutas de este controlador, asegurando que solo los usuarios autenticados y con los roles adecuados puedan acceder a las funcionalidades relacionadas con las ausencias.
// Importaciones necesarias para el controlador, incluyendo decoradores de NestJS, DTOs, servicios y entidades relacionadas con la autenticación y las ausencias.

/**
 * * * * AbsenceController
 * * Controlador para gestionar las ausencias de los trabajadores. Define la ruta base para este controlador y aplica los guards de autenticación y roles. El controlador AbsenceController maneja las solicitudes HTTP relacionadas con las ausencias de los trabajadores. Incluye endpoints para crear una nueva ausencia, listar las ausencias del usuario autenticado, listar todas las ausencias de la empresa (solo para administradores), buscar una ausencia por su ID, eliminar una ausencia y actualizar el estado de una ausencia (solo para administradores). Cada endpoint está protegido por guards que verifican la autenticación JWT y los roles de usuario, asegurando que solo los usuarios autorizados puedan acceder a cada funcionalidad.
 * @see CreateAbsenceDto para la estructura de datos al crear una ausencia.
 * @see AbsenceService para la lógica de negocio relacionada con las ausencias.
 * @see JwtAuthGuard para la protección de rutas mediante autenticación JWT.  
 * @see RolesGuard para la protección de rutas mediante validación de roles.
 * @see Roles para la asignación de roles a los endpoints.
 * @see GetUser para obtener el usuario autenticado en los endpoints.
 * @see User para la entidad de usuarios.
 * @see AusenciaEstado para los posibles estados de una ausencia.
 * @see UserRole para los roles de usuario en el sistema.
 * @see https://docs.nestjs.com/controllers
 * @see https://docs.nestjs.com/security/authentication
 * @see https://docs.nestjs.com/security/authorization
 * 
 */
@Controller('ausencia')
@UseGuards(JwtAuthGuard, RolesGuard) //  Protegemos con JWT y Validación de Roles
export class AbsenceController {
  constructor(private readonly ausenciaService: AbsenceService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.WORKER) //  Superadmin excluido
  create(
    @Body() createAusenciaDto: CreateAbsenceDto, 
    @GetUser() user: User 
  ) {
    return this.ausenciaService.create(createAusenciaDto, user);
  }

  // Endpoint para que el trabajador vea sus propias ausencias
  /**
   * Endpoint para que el trabajador vea sus propias ausencias. El SUPERADMIN no podrá acceder a este endpoint, ya que la lógica de negocio en el servicio bloqueará el acceso si el usuario no tiene una empresa asignada.
   * @param user Usuario autenticado que realiza la solicitud. Se obtiene mediante el decorador @GetUser, que extrae la información del usuario del token JWT. 
   * @returns Una lista de ausencias asociadas al usuario autenticado.
   * @throws BadRequestException si el usuario no tiene una empresa asignada.
   * @see AbsenceService.findAllByUsuario para la lógica de negocio relacionada con la obtención de las ausencias del usuario.
   * @Roles(UserRole.ADMIN, UserRole.WORKER) asegura que solo los usuarios con rol de ADMIN o WORKER puedan acceder a este endpoint, excluyendo al SUPERADMIN.
   * @GetUser() se utiliza para obtener el usuario autenticado en el contexto de la solicitud, lo que permite que el servicio de ausencias filtre las ausencias correspondientes a ese usuario.
   * @see https://docs.nestjs.com/controllers#request-payloads
   * @see https://docs.nestjs.com/security/authentication#accessing-the-authenticated-user
   * 
   */
  @Get('mis-ausencias')
  @Roles(UserRole.ADMIN, UserRole.WORKER) //  Superadmin excluido
  findMyAusencias(@GetUser() user: User) {
    return this.ausenciaService.findAllByUsuario(user.id);
  }

  //  Endpoint para que el ADMIN vea las ausencias de sus trabajadores
  /**
   * Endpoint para que el ADMIN vea las ausencias de sus trabajadores. El SUPERADMIN no podrá acceder a este endpoint, ya que la lógica de negocio en el servicio bloqueará el acceso si el administrador no tiene una empresa asignada.
   * @param admin 
Usuario autenticado que realiza la solicitud. Se espera que sea un administrador de empresa, y se obtiene mediante el decorador @GetUser, que extrae la información del usuario del token JWT.  
    * @returns Una lista de ausencias asociadas a la empresa del administrador autenticado.
    * @throws BadRequestException si el administrador no tiene una empresa asignada.
    * @see AbsenceService.findAllByEmpresa para la lógica de negocio relacionada con la obtención de las ausencias de la empresa.
    * @Roles(UserRole.ADMIN) asegura que solo los usuarios con rol de ADMIN puedan acceder a este endpoint, excluyendo a WORKER y SUPERADMIN. 
    * @GetUser() se utiliza para obtener el usuario autenticado en el contexto de la solicitud, lo que permite que el servicio de ausencias filtre las ausencias correspondientes a la empresa del administrador.
    * @see https://docs.nestjs.com/controllers#request-payloads
    * @see https://docs.nestjs.com/security/authentication#accessing-the-authenticated-user
    * 
    *  
   */
  @Get('list-ausencias')
  @Roles(UserRole.ADMIN) //  Acceso exclusivo para administradores de empresa
  findAllByEmpresa(@GetUser() admin: User) {
    if (!admin.empresaId) {
      throw new BadRequestException('El administrador no tiene una empresa asignada.');
    }
    return this.ausenciaService.findAllByEmpresa(admin.empresaId);
  }

  // Endpoint para buscar una ausencia por su ID, accesible para el trabajador dueño de la ausencia o el administrador de la empresa
  // El SUPERADMIN no podrá acceder a este endpoint, ya que la lógica de negocio en el servicio bloqueará el acceso si no es el dueño o el admin de ESA empresa.
  /**
   * Endpoint para buscar una ausencia por su ID, accesible para el trabajador dueño de la ausencia o el administrador de la empresa. El SUPERADMIN no podrá acceder a este endpoint, ya que la lógica de negocio en el servicio bloqueará el acceso si no es el dueño o el admin de ESA empresa.
   * @param id ID de la ausencia que se desea obtener. Se extrae de la ruta mediante el decorador @Param y se valida como un número entero utilizando ParseIntPipe.   
   * @param user Usuario autenticado que realiza la solicitud. Se espera que sea el trabajador dueño de la ausencia o un administrador de la empresa, y se obtiene mediante el decorador @GetUser, que extrae la información del usuario del token JWT.
   * @return La ausencia correspondiente al ID proporcionado, si el usuario tiene permiso para acceder a ella.
   * @throws NotFoundException si no se encuentra la ausencia con el ID proporcionado.
   * @see AbsenceService.findOne para la lógica de negocio relacionada con la obtención de una ausencia por su ID y la validación de permisos.
   * @Roles(UserRole.ADMIN, UserRole.WORKER) asegura que solo los usuarios con rol de ADMIN o WORKER puedan acceder a este endpoint, excluyendo al SUPERADMIN. Sin embargo, la lógica de negocio en el servicio también verifica que el usuario sea el dueño de la ausencia o un administrador de la misma empresa, lo que garantiza que el SUPERADMIN no pueda acceder a ausencias que no le pertenecen.
   * @GetUser() se utiliza para obtener el usuario autenticado en el contexto de la solicitud, lo que permite que el servicio de ausencias valide si el usuario tiene permiso para acceder a la ausencia solicitada.
   * @see https://docs.nestjs.com/controllers#request-payloads
   * @see https://docs.nestjs.com/security/authentication#accessing-the-authenticated-user
   * 
   */

  @Get('find/:id')
  @Roles(UserRole.ADMIN, UserRole.WORKER) //  Superadmin excluido
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.ausenciaService.findOne(id, user);
  }


  // Endpoint para eliminar una ausencia, accesible para el trabajador dueño de la ausencia o el administrador de la empresa, siempre que la ausencia esté en estado PENDIENTE
  // El SUPERADMIN no podrá eliminar ausencias que no le pertenecen, ya que la lógica de negocio en el servicio bloqueará el acceso si no es el dueño o el admin de ESA empresa.
  /**
   * Endpoint para eliminar una ausencia, accesible para el trabajador dueño de la ausencia o el administrador de la empresa, siempre que la ausencia esté en estado PENDIENTE. El SUPERADMIN no podrá eliminar ausencias que no le pertenecen, ya que la lógica de negocio en el servicio bloqueará el acceso si no es el dueño o el admin de ESA empresa.
   * 
   * @param id ID de la ausencia que se desea eliminar. Se extrae de la ruta mediante el decorador @Param y se valida como un número entero utilizando ParseIntPipe.
   * @param user Usuario autenticado que realiza la solicitud. Se espera que sea el trabajador dueño de la ausencia o un administrador de la empresa, y se obtiene mediante el decorador @GetUser, que extrae la información del usuario del token JWT. 
   *  @return Un mensaje de éxito si la ausencia se elimina correctamente, o una excepción si la ausencia no se encuentra, no está en estado PENDIENTE o el usuario no tiene permiso para eliminarla.
   * @throws NotFoundException si no se encuentra la ausencia con el ID proporcionado.
   * @throws ForbiddenException si la ausencia no está en estado PENDIENTE o si el usuario no tiene permiso para eliminarla.
   * @see AbsenceService.remove para la lógica de negocio relacionada con la eliminación de una ausencia y la validación de permisos.
   * @Roles(UserRole.ADMIN, UserRole.WORKER) asegura que solo los usuarios con rol de ADMIN o WORKER puedan acceder a este endpoint, excluyendo al SUPERADMIN. Sin embargo, la lógica de negocio en el servicio también verifica que el usuario sea el dueño de la ausencia o un administrador de la misma empresa, y que la ausencia esté en estado PENDIENTE, lo que garantiza que el SUPERADMIN no pueda eliminar ausencias que no le pertenecen o que ya han sido procesadas.
   * @GetUser() se utiliza para obtener el usuario autenticado en el contexto de la solicitud, lo que permite que el servicio de ausencias valide si el usuario tiene permiso para eliminar la ausencia solicitada.
   * @see https://docs.nestjs.com/controllers#request-payloads  
   * @see https://docs.nestjs.com/security/authentication#accessing-the-authenticated-user
   * 
   */
  @Delete('delete/:id')
  @Roles(UserRole.ADMIN, UserRole.WORKER) //  Superadmin excluido
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.ausenciaService.remove(id, user);
  }


  // Endpoint para actualizar el estado de una ausencia, accesible solo para administradores de la empresa
  // El SUPERADMIN no podrá actualizar el estado de ausencias que no le pertenecen, ya que la lógica de negocio en el servicio bloqueará el acceso si no es el dueño o el admin de ESA empresa.
  /**
   *  Endpoint para actualizar el estado de una ausencia, accesible solo para administradores de la empresa. El SUPERADMIN no podrá actualizar el estado de ausencias que no le pertenecen, ya que la lógica de negocio en el servicio bloqueará el acceso si no es el dueño o el admin de ESA empresa.
   * @param id ID de la ausencia cuyo estado se desea actualizar. Se extrae de la ruta mediante el decorador @Param y se valida como un número entero utilizando ParseIntPipe.
   * @param estado Nuevo estado que se desea asignar a la ausencia. Se extrae del cuerpo de la solicitud mediante el decorador @Body.
   * @param admin Usuario autenticado que realiza la solicitud. Se espera que sea un administrador de empresa, y se obtiene mediante el decorador @GetUser, que extrae la información del usuario del token JWT.
   * @return La ausencia actualizada con el nuevo estado, si el administrador tiene permiso para actualizarla.
   * @throws NotFoundException si no se encuentra la ausencia con el ID proporcionado.
   * @throws ForbiddenException si el administrador no tiene permiso para actualizar el estado de la ausencia.
   * @see AbsenceService.updateEstado para la lógica de negocio relacionada con la actualización del estado de una ausencia y la validación de permisos.
   * @Roles(UserRole.ADMIN) asegura que solo los usuarios con rol de ADMIN puedan acceder a este endpoint, excluyendo a WORKER y SUPERADMIN. Sin embargo, la lógica de negocio en el servicio también verifica que el administrador sea un administrador de la misma empresa que la ausencia, lo que garantiza que el SUPERADMIN no pueda actualizar el estado de ausencias que no le pertenecen.
   * @GetUser() se utiliza para obtener el usuario autenticado en el contexto de la solicitud, lo que permite que el servicio de ausencias valide si el administrador tiene permiso para actualizar el estado de la ausencia solicitada.
   * @see https://docs.nestjs.com/controllers#request-payloads
   * @see https://docs.nestjs.com/security/authentication#accessing-the-authenticated-user
   * 
   */
  @Put('update/:id')
  @Roles(UserRole.ADMIN, UserRole.WORKER) // Superadmin excluido
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAbsenceDto: UpdateAbsenceDto,
    @GetUser() user: User
  ) {
    return this.ausenciaService.update(id, updateAbsenceDto, user);
  }

  // Endpoint para actualizar el estado de una ausencia, accesible solo para administradores de la empresa
  // El SUPERADMIN no podrá actualizar el estado de ausencias que no le pertenecen, ya que la lógica de negocio en el servicio bloqueará el acceso si no es el dueño o el admin de ESA empresa.
  /**
   * Endpoint para actualizar el estado de una ausencia, accesible solo para administradores de la empresa. El SUPERADMIN no podrá actualizar el estado de ausencias que no le pertenecen, ya que la lógica de negocio en el servicio bloqueará el acceso si no es el dueño o el admin de ESA empresa.
   * 
   * @param id ID de la ausencia cuyo estado se desea actualizar. Se extrae de la ruta mediante el decorador @Param y se valida como un número entero utilizando ParseIntPipe.
   * @param estado Nuevo estado que se desea asignar a la ausencia. Se extrae del cuerpo de la solicitud mediante el decorador @Body.
   * @param admin Usuario autenticado que realiza la solicitud. Se espera que sea un administrador de empresa, y se obtiene mediante el decorador @GetUser, que extrae la información del usuario del token JWT.
   * @return La ausencia actualizada con el nuevo estado, si el administrador tiene permiso para actualizarla.
   * @throws NotFoundException si no se encuentra la ausencia con el ID proporcionado.
   * @throws ForbiddenException si el administrador no tiene permiso para actualizar el estado de la ausencia.
   * @see AbsenceService.updateEstado para la lógica de negocio relacionada con la actualización del estado de una ausencia y la validación de permisos.
   * @Roles(UserRole.ADMIN) asegura que solo los usuarios con rol de ADMIN puedan acceder a este endpoint, excluyendo a WORKER y SUPERADMIN. Sin embargo, la lógica de negocio en el servicio también verifica que el administrador sea un administrador de la misma empresa que la ausencia, lo que garantiza que el SUPERADMIN no pueda actualizar el estado de ausencias que no le pertenecen.
   * @GetUser() se utiliza para obtener el usuario autenticado en el contexto de la solicitud, lo que permite que el servicio de ausencias valide si el administrador tiene permiso para actualizar el estado de la ausencia solicitada.
   * @see https://docs.nestjs.com/controllers#request-payloads
   * @see https://docs.nestjs.com/security/authentication#accessing-the-authenticated-user
   * 
   */ 
  @Put('estado/:id')
  @Roles(UserRole.ADMIN) //  Solo el ADMIN puede cambiar estados
  async updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: AusenciaEstado,
    @GetUser() admin: User 
  ) {
    console.log('--- ENTRANDO AL CONTROLADOR ---');
    console.log('ID Ausencia:', id);
    console.log('Nuevo Estado:', estado);
    console.log('ID Admin que procesa:', admin.id);

    return this.ausenciaService.updateEstado(id, estado, admin);
  }
}