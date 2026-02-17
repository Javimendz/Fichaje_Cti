import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Patch, 
  UseGuards, 
  Query, 
  BadRequestException 
} from '@nestjs/common';
import { WorkdayService } from './workday.service';
import { CheckInDto } from './dto/check-in.dto';

// Auth Imports
import { GetUser } from 'auth/decorators/get-user.decorator';
import { JwtAuthGuard } from 'auth/guards/jwt-auth.guard';
import type { UserPayload } from 'auth/interfaces/user-payload.interface'; 

@Controller('jornada')
@UseGuards(JwtAuthGuard)
export class WorkdayController {
  constructor(private readonly workdayService: WorkdayService) {}

  /**
   * Inicia una nueva jornada laboral.
   * POST /jornada/check-in
   * El método checkIn recibe un DTO con la latitud y longitud del usuario al momento de hacer check-in, junto con la información del usuario autenticado obtenida a través del decorador @GetUser. La lógica de negocio para validar el check-in (como verificar si ya hay una jornada activa, validar la ubicación, etc.) se delega completamente al WorkdayService, manteniendo el controlador limpio y enfocado en manejar la solicitud HTTP y la seguridad de acceso.
   * @param checkInDto DTO que contiene la latitud y longitud del usuario al hacer check-in.
   * @param user Usuario autenticado que realiza el check-in, obtenido a través del decorador @GetUser. Este objeto contiene información como el ID del usuario, su email, rol, etc., que puede ser utilizada por el WorkdayService para validar y registrar la jornada laboral correctamente.
   * @return La jornada laboral creada o un mensaje de error si el check-in no es válido (por ejemplo, si ya hay una jornada activa).
   * * Este endpoint es fundamental para el sistema de fichaje, ya que marca el inicio de la jornada laboral de un usuario. La información de ubicación puede ser utilizada para validar que el usuario está en un lugar permitido para trabajar, y la información del usuario se utiliza para asociar la jornada laboral con el usuario correcto en la base de datos.
   * 
   */

  @Post('check-in')
  async checkIn(
    @Body() checkInDto: CheckInDto, 
    @GetUser() user: UserPayload 
  ) {
    return this.workdayService.checkIn(checkInDto, user);
  }

  /**
   * Finaliza la jornada laboral activa.
   * PATCH /jornada/check-out
   * El método checkOut recibe un DTO con la latitud y longitud del usuario al momento de hacer check-out, junto con la información del usuario autenticado obtenida a través del decorador @GetUser. La lógica de negocio para validar el check-out (como verificar si hay una jornada activa, validar la ubicación, calcular la duración de la jornada, etc.) se delega completamente al WorkdayService, manteniendo el controlador limpio y enfocado en manejar la solicitud HTTP y la seguridad de acceso.
   * @param checkOutDto DTO que contiene la latitud y longitud del usuario al hacer check-out.
   * @param user Usuario autenticado que realiza el check-out, obtenido a través del decorador @GetUser. Este objeto contiene información como el ID del usuario, su email, rol, etc., que puede ser utilizada por el WorkdayService para validar y registrar la finalización de la jornada laboral correctamente.
   * @return La jornada laboral actualizada con la hora de finalización o un mensaje de error si el check-out no es válido (por ejemplo, si no hay una jornada activa).
   * * Este endpoint es esencial para el sistema de fichaje, ya que marca el final de la jornada laboral de un usuario. La información de ubicación puede ser utilizada para validar que el usuario está en un lugar permitido para finalizar su jornada, y la información del usuario se utiliza para asociar correctamente la finalización de la jornada laboral con el usuario en la base de datos.
   */
  @Patch('check-out') 
  async checkOut(
    @Body() checkOutDto: CheckInDto, 
    @GetUser() user: UserPayload 
  ) {
    return this.workdayService.checkOut(checkOutDto, user);
  }

  /**
   * Consulta el estado actual (¿Estoy trabajando?).
   * GET /jornada/status
   * El método getStatus utiliza la información del usuario autenticado obtenida a través del decorador @GetUser para consultar el estado actual de la jornada laboral del usuario. La lógica de negocio para determinar si el usuario tiene una jornada activa y obtener los detalles de esa jornada se delega completamente al WorkdayService, manteniendo el controlador limpio y enfocado en manejar la solicitud HTTP y la seguridad de acceso.
   * @param user Usuario autenticado que realiza la consulta, obtenido a través del decorador @GetUser. Este objeto contiene información como el ID del usuario, su email, rol, etc., que puede ser utilizada por el WorkdayService para validar y obtener el estado de la jornada laboral correctamente.
   * @return Un objeto que indica si el usuario está trabajando actualmente (isWorking) y los detalles de la jornada laboral activa (jornada) si existe, o null si no hay una jornada activa.
   * * Este endpoint es útil para que los usuarios puedan verificar rápidamente si tienen una jornada laboral activa, lo que puede ser especialmente útil para aplicaciones móviles o interfaces de usuario donde los usuarios necesitan confirmar su estado de fichaje de manera rápida y sencilla.
   * 
   */
  @Get('status')
  async getStatus(@GetUser() user: UserPayload) {
    // Nota: 'user.id' debe existir en tu UserPayload. Si tu payload usa 'userId', cámbialo aquí.
    const activeWorkday = await this.workdayService.findActiveWorkday(user.id);
    
    return {
      isWorking: !!activeWorkday, 
      jornada: activeWorkday || null
    };
  }

  /**
   * Obtiene el historial completo del usuario.
   * GET /jornada/historial
   * El método getMyHistory utiliza la información del usuario autenticado obtenida a través del decorador @GetUser para consultar el historial completo de jornadas laborales del usuario. La lógica de negocio para obtener y formatear el historial de jornadas se delega completamente al WorkdayService, manteniendo el controlador limpio y enfocado en manejar la solicitud HTTP y la seguridad de acceso.
   * @param user Usuario autenticado que realiza la consulta, obtenido a través del decorador @GetUser. Este objeto contiene información como el ID del usuario, su email, rol, etc., que puede ser utilizada por el WorkdayService para validar y obtener el historial de jornadas laborales correctamente.
   * @return Un array con el historial completo de jornadas laborales del usuario, incluyendo detalles como fechas de inicio y fin, duración, ubicación, etc. Si el usuario no tiene jornadas registradas, se devolverá un array vacío.
   * * Este endpoint es fundamental para que los usuarios puedan revisar su historial de fichajes, lo que puede ser útil para verificar horas trabajadas, corregir errores de fichaje, o simplemente para llevar un registro personal de sus jornadas laborales. Además, este historial puede ser utilizado por los administradores para supervisar y gestionar las jornadas laborales de los empleados.
   * 
   */
  @Get('historial')
  async getMyHistory(@GetUser() user: UserPayload) {
    return this.workdayService.getHistory(user.id);
  }

  /**
   * Obtiene jornadas en un rango de fechas.
   * GET /jornada/rango?desde=2023-01-01&hasta=2023-01-31
   * El método getByRange recibe un rango de fechas a través de los parámetros de consulta 'desde' y 'hasta', junto con la información del usuario autenticado obtenida a través del decorador @GetUser. La lógica de negocio para validar las fechas, consultar las jornadas dentro del rango, y formatear la respuesta se delega completamente al WorkdayService, manteniendo el controlador limpio y enfocado en manejar la solicitud HTTP y la seguridad de acceso.
   * @param user Usuario autenticado que realiza la consulta, obtenido a través del decorador @GetUser. Este objeto contiene información como el ID del usuario, su email, rol, etc., que puede ser utilizada por el WorkdayService para validar y obtener las jornadas dentro del rango de fechas correctamente.
   * @param desde Fecha de inicio del rango en formato YYYY-MM-DD, recibida a través de los parámetros de consulta. Se valida que sea una fecha válida antes de procesar la solicitud.
   * @param hasta Fecha de fin del rango en formato YYYY-MM-DD, recibida a través de los parámetros de consulta. Se valida que sea una fecha válida antes de procesar la solicitud.
   * @return Un array con las jornadas laborales del usuario que se encuentran dentro del rango de fechas especificado, incluyendo detalles como fechas de inicio y fin, duración, ubicación, etc. Si no hay jornadas dentro del rango, se devolverá un array vacío. Si las fechas no son válidas, se lanzará una excepción BadRequestException.
   * * Este endpoint es útil para que los usuarios puedan consultar sus jornadas laborales dentro de un período específico, lo que puede ser útil para revisar horas trabajadas en un mes, preparar reportes, o simplemente para llevar un registro organizado de sus jornadas laborales. Además, este endpoint puede ser utilizado por los administradores para supervisar y gestionar las jornadas laborales de los empleados dentro de períodos específicos.
   * 
   */
  @Get('rango')
  async getByRange(
    @GetUser() user: UserPayload,
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    const startDate = new Date(desde);
    const endDate = new Date(hasta);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Las fechas no son válidas (Formato esperado: YYYY-MM-DD)');
    }

    return this.workdayService.findAllByRange(
      user.id, 
      startDate, 
      endDate
    );
  }
}