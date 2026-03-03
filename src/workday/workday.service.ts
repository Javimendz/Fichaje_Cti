import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Between, Not } from 'typeorm';
import { Workday } from './entities/workday.entity';
import { CheckInDto } from './dto/check-in.dto';
import type { UserPayload } from 'auth/interfaces/user-payload.interface'; 
import { AlarmsService } from 'alarms/alarms.service';
import { AlarmType } from 'alarms/entities/alarm.entity';
import { User } from 'users/entities/user.entity';


// Importamos el UserPayload que se obtiene del token JWT para validar la empresa y el usuario que realiza la acción. Esto nos permite asegurar que solo los usuarios autenticados y autorizados puedan iniciar o finalizar su jornada laboral, y que las acciones se registren correctamente asociadas a su empresa y perfil de usuario.
// El servicio de Workday se encarga de gestionar la lógica de negocio relacionada con las jornadas laborales. Incluye métodos para iniciar una jornada (check-in), finalizarla (check-out), consultar el estado actual, obtener el historial completo, y filtrar jornadas por rango de fechas. Utiliza el repositorio de Workday para interactuar con la base de datos, y recibe el UserPayload para validar la empresa y el usuario que realiza las acciones, asegurando que solo los usuarios autorizados puedan gestionar sus jornadas laborales.
/**
 * * * WorkdayService
 * * Gestiona la lógica de negocio relacionada con las jornadas laborales. Incluye métodos para iniciar una jornada (check-in), finalizarla (check-out), consultar el estado actual, obtener el historial completo, y filtrar jornadas por rango de fechas. Utiliza el repositorio de Workday para interactuar con la base de datos, y recibe el UserPayload para validar la empresa y el usuario que realiza las acciones, asegurando que solo los usuarios autorizados puedan gestionar sus jornadas laborales.
 * 
 * */

@Injectable()
export class WorkdayService {
  private readonly logger = new Logger('WorkdayService'); // 👈 Añadimos Logger
  constructor(
    @InjectRepository(Workday)
    private readonly workdayRepository: Repository<Workday>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly alarmService: AlarmsService,
  ) {}

  // ============================================
  // 1. INICIAR JORNADA (Check-In)
  // ============================================
  /**
   * 
   * @param dto  CheckInDto que contiene la latitud y longitud del check-in, opcionalmente se puede incluir empresaId para validar que el usuario pertenece a la empresa correcta (aunque esto también se puede validar usando el UserPayload).  
   * @param user UserPayload que contiene información del usuario autenticado (incluyendo empresaId)
   * @returns  La jornada laboral creada. Si el usuario no tiene una empresa asignada, o si ya tiene una jornada activa, se lanzará una excepción.
   * * Este método inicia una nueva jornada laboral para el usuario autenticado. Primero valida que el usuario tenga una empresa asignada, luego verifica que no tenga una jornada activa (con fin = null) para evitar fichajes duplicados. Si todo es correcto, crea una nueva entrada en la base de datos con la hora de inicio, tipo "Entrada", y la ubicación GPS proporcionada. La relación con el usuario y la empresa se establece directamente usando los IDs, lo que optimiza el proceso sin necesidad de cargar las entidades completas.
   * * El método delega toda la lógica de validación y creación al WorkdayService, manteniendo el controlador limpio y enfocado en manejar la solicitud HTTP y la seguridad de acceso. El WorkdayService se encargará de validar los datos, gestionar las relaciones con el usuario y la empresa, y garantizar que un usuario solo pueda tener una jornada activa a la vez.
   */
 async checkIn(dto: CheckInDto, userPayload: UserPayload) { 
    if (!userPayload.empresaId) throw new BadRequestException('No tienes empresa asignada.');

    const activeWorkday = await this.workdayRepository.findOne({
      where: { usuario: { id: userPayload.id }, fin: IsNull() }
    });

    if (activeWorkday) throw new BadRequestException('Ya tienes una jornada activa.');

    const usuarioDB = await this.userRepository.findOne({
      where: { id: userPayload.id },
      relations: ['horario', 'horario.distribuciones', 'horario.distribuciones.franjas', 'empresa']
    });

    if (!usuarioDB) throw new BadRequestException('Usuario no encontrado.');

    // --- 🌍 FIX GEOFENCING: Forzamos números y damos un radio por defecto ---
    const latEmpresa = Number(usuarioDB.empresa?.latitud);
    const lngEmpresa = Number(usuarioDB.empresa?.longitud);
    const radioConfig = Number(process.env.MAX_FICHAR_DISTANCE) || 600;
    const radioPermitido = Number(usuarioDB.empresa?.radioPermitido || radioConfig); // 100m por defecto

    if (dto.latitud && dto.longitud && latEmpresa && lngEmpresa) {
      const distancia = this.calcularDistancia(
        Number(dto.latitud), Number(dto.longitud), latEmpresa, lngEmpresa
      );

      this.logger.log(`📍 Fichaje ID:${userPayload.id} - Distancia a la sede: ${distancia.toFixed(2)}m (Radio: ${radioPermitido}m)`);

      if (distancia > radioPermitido) {
        await this.alarmService.triggerAlarm(
          userPayload.id, userPayload.empresaId, AlarmType.UNAUTHORIZED_ZONE,
          `ZONA NO AUTORIZADA: Fichaje a ${distancia.toFixed(0)}m de la oficina (Radio máx: ${radioPermitido}m).`
        );
      }
    } else {
      this.logger.warn(`⚠️ [ID:${userPayload.id}] Geofencing omitido: Faltan coordenadas del usuario o empresa.`);
    }

    // --- 3. Creamos la jornada ---
    const ahora = new Date();
    const newWorkday = this.workdayRepository.create({
      inicio: ahora,
      latitudEntrada: dto.latitud,      
      longitudEntrada: dto.longitud,
      presente: dto.presente,
      tipo: 'Entrada',
      usuario: { id: userPayload.id },  
      empresa: { id: userPayload.empresaId } 
    });

    const savedWorkday = await this.workdayRepository.save(newWorkday);

    await this.alarmService.resolverAlarmasPrevias(userPayload.id, [AlarmType.ABSENCE]);

    // ---  VALIDACIÓN DE RETRASO ---
    const distHoy = this.obtenerDistribucionHoy(usuarioDB);
    if (distHoy?.franjas?.[0]?.inicio) {
      const esTarde = this.comprobarRetraso(ahora, distHoy.franjas[0].inicio, 10);
      if (esTarde) {
        await this.alarmService.triggerAlarm(
          userPayload.id, userPayload.empresaId, AlarmType.LATE_ARRIVAL,
          `RETRASO: Entrada a las ${ahora.toLocaleTimeString('en-GB')} (Teórica: ${distHoy.franjas[0].inicio}).`
        );
      }
    }

    return savedWorkday;
  }

  // ============================================
  // 2. FINALIZAR JORNADA (Check-Out)
  // ============================================
  /**
   * 
   * @param dto CheckInDto que contiene la latitud y longitud del check-out, opcionalmente se puede incluir empresaId para validar que el usuario pertenece a la empresa correcta (aunque esto también se puede validar usando el UserPayload). 
   * @param user UserPayload que contiene información del usuario autenticado (incluyendo empresaId) 
   * @returns La jornada laboral actualizada con la hora de fin, tipo "Salida", ubicación GPS de salida, y el cálculo de minutos trabajados. Si no hay una jornada activa para cerrar, se lanzará una excepción.
   * * Este método finaliza la jornada laboral activa para el usuario autenticado. Primero busca la jornada que está abierta (con fin = null) para ese usuario. Si no encuentra ninguna, lanza una excepción indicando que no hay jornada activa para cerrar. Si encuentra la jornada, actualiza la hora de fin con la hora actual, cambia el tipo a "Salida", y opcionalmente actualiza la ubicación GPS de salida si se proporciona en el DTO. Luego calcula el total de minutos trabajados restando la hora de inicio de la hora de fin, y guarda los cambios en la base de datos. La relación con el usuario y la empresa ya está establecida desde el check-in, por lo que solo se actualizan los campos necesarios.
   * * El método delega toda la lógica de validación y actualización al WorkdayService, manteniendo el controlador limpio y enfocado en manejar la solicitud HTTP y la seguridad de acceso. El WorkdayService se encargará de validar los datos, gestionar las relaciones con el usuario y la empresa, y garantizar que un usuario solo pueda cerrar una jornada activa.
   * * ATENCIÓN AL BUG DEL GPS: Si tu entidad Workday solo tiene los campos 'latitud' y 'longitud', al actualizar estos campos en el check-out estarías sobrescribiendo la ubicación de entrada. Lo ideal sería tener campos separados para la ubicación de entrada y salida (por ejemplo, latitudEntrada, longitudEntrada, latitudSalida, longitudSalida) para conservar ambas ubicaciones. Si decides sobrescribirlos, ten en cuenta que perderás la información de la ubicación de entrada. 
   */
  async checkOut(dto: CheckInDto, userPayload: UserPayload) {
    const jornada = await this.workdayRepository.findOne({
      where: { usuario: { id: userPayload.id }, fin: IsNull() }
    });

    if (!jornada) throw new BadRequestException('No hay jornada activa.');

    const usuarioDB = await this.userRepository.findOne({
      where: { id: userPayload.id },
      relations: ['horario', 'horario.distribuciones', 'horario.distribuciones.franjas', 'empresa']
    });

    const ahora = new Date();
    jornada.fin = ahora;
    
    if (dto.latitud && dto.longitud) {
       jornada.latitudSalida = dto.latitud; 
       jornada.longitudSalida = dto.longitud;
    }
    
    jornada.total_minutos = Math.floor((ahora.getTime() - jornada.inicio.getTime()) / 60000);
    jornada.tipo = 'Salida';
    jornada.presente = dto.presente;

    const savedWorkday = await this.workdayRepository.save(jornada);

    if(!usuarioDB) throw new NotFoundException('Usuario no encontrado.');  
    
    const distHoy = this.obtenerDistribucionHoy(usuarioDB);
    if (distHoy && distHoy.franjas && distHoy.franjas.length > 0) {
      const ultimaFranja = distHoy.franjas[distHoy.franjas.length - 1];
      if (ultimaFranja.fin) {
        const esPronto = this.comprobarSalidaAnticipada(ahora, ultimaFranja.fin, 5); 
        if (esPronto) {
          await this.alarmService.triggerAlarm(
            userPayload.id, userPayload.empresaId, AlarmType.EARLY_DEPARTURE,
            `SALIDA ANTICIPADA: Fichó a las ${ahora.toLocaleTimeString('en-GB')} (Teórica: ${ultimaFranja.fin}).`
          );
        }
      }
    }

    return savedWorkday;
  }
  // ============================================
  // 3. ESTADO ACTUAL (Status)
  // ============================================
  /**
   * 
   * @param usuarioId ID del usuario autenticado para el cual se desea consultar el estado actual de la jornada laboral. Este ID se obtiene del UserPayload que se pasa al servicio, asegurando que solo se consulte el estado del usuario autenticado.
   *  
   * @returns La jornada laboral activa del usuario, o null si no hay ninguna activa.
   * * Este método consulta si el usuario autenticado tiene una jornada laboral activa (con fin = null). Si encuentra una jornada activa, devuelve esa jornada; si no encuentra ninguna, devuelve null. Esto permite al frontend mostrar el estado actual del usuario (si está trabajando o no) y los detalles de la jornada activa si existe. La lógica de consulta se delega al WorkdayService, manteniendo el controlador limpio y enfocado en manejar la solicitud HTTP y la seguridad de acceso.
   * * ATENCIÓN AL BUG DEL STATUS: Si tu entidad Workday solo tiene los campos 'latitud' y 'longitud', al consultar el estado actual no podrás distinguir entre la ubicación de entrada y salida, ya que ambos campos se sobrescriben en el check-out. Para solucionar esto, lo ideal sería tener campos separados para la ubicación de entrada y salida (por ejemplo, latitudEntrada, longitudEntrada, latitudSalida, longitudSalida) para conservar ambas ubicaciones y poder mostrarlas correctamente en el estado actual.
   */
  async findActiveWorkday(usuarioId: number): Promise<Workday | null> {
    return await this.workdayRepository.findOne({
      where: { usuario: { id: usuarioId }, fin: IsNull() }
    });
  }

  // ============================================
  // 4. HISTORIAL COMPLETO
  // ============================================
  /**
   * @param usuarioId ID del usuario autenticado para el cual se desea obtener el historial completo de jornadas laborales. Este ID se obtiene del UserPayload que se pasa al servicio, asegurando que solo se consulte el historial del usuario autenticado.
   * @return Lista de jornadas laborales del usuario ordenadas por fecha de inicio de forma descendente. Si el usuario no tiene ninguna jornada registrada, se devolverá una lista vacía.
   * * Este método obtiene el historial completo de jornadas laborales para el usuario autenticado. Consulta todas las jornadas asociadas al usuario, ordenadas por fecha de inicio de forma descendente (de la más reciente a la más antigua). Esto permite al frontend mostrar un historial completo de las jornadas laborales del usuario, incluyendo detalles como fechas, horas, tipo de jornada, ubicación, y duración. La lógica de consulta se delega al WorkdayService, manteniendo el controlador limpio y enfocado en manejar la solicitud HTTP y la seguridad de acceso.
   * * ATENCIÓN AL BUG DEL HISTORIAL: Si tu entidad Workday solo tiene los campos 'latitud' y 'longitud', al obtener el historial no podrás distinguir entre la ubicación de entrada y salida para cada jornada, ya que ambos campos se sobrescriben en el check-out. Para solucionar esto, lo ideal sería tener campos separados para la ubicación de entrada y salida (por ejemplo, latitudEntrada, longitudEntrada, latitudSalida, longitudSalida) para conservar ambas ubicaciones y poder mostrarlas correctamente en el historial.
   */
  async getHistory(usuarioId: number) {
    return await this.workdayRepository.find({
      where: { usuario: { id: usuarioId } },
      order: { inicio: 'DESC' }
    });
  }

  // ============================================
  // 5. HISTORIAL POR RANGO DE FECHAS
  // ============================================
  /**
   * @param usuarioId ID del usuario autenticado para el cual se desea obtener el historial de jornadas laborales en un rango de fechas específico. Este ID se obtiene del UserPayload que se pasa al servicio, asegurando que solo se consulte el historial del usuario autenticado.
   * @param desde Fecha de inicio del rango (inclusive) para filtrar las jornadas laborales. Debe ser una fecha válida en formato ISO (YYYY-MM-DD).
   * @param hasta Fecha de fin del rango (inclusive) para filtrar las jornadas laborales. Debe ser una fecha válida en formato ISO (YYYY-MM-DD).
   * @return Lista de jornadas laborales del usuario que se iniciaron dentro del rango de fechas especificado, ordenadas por fecha de inicio de forma descendente. Si no hay jornadas dentro del rango, se devolverá una lista vacía.
   * * Este método obtiene el historial de jornadas laborales para el usuario autenticado filtrado por un rango de fechas específico. Utiliza el operador Between de TypeORM para consultar las jornadas que se iniciaron entre las fechas 'desde' y 'hasta'. Esto permite al frontend mostrar un historial filtrado de las jornadas laborales del usuario, lo que es útil para revisar períodos específicos de trabajo. La lógica de consulta se delega al WorkdayService, manteniendo el controlador limpio y enfocado en manejar la solicitud HTTP y la seguridad de acceso.
   * * * ATENCIÓN AL BUG DEL RANGO DE FECHAS: Si tu entidad Workday solo tiene los campos 'latitud' y 'longitud', al obtener el historial por rango de fechas no podrás distinguir entre la ubicación de entrada y salida para cada jornada, ya que ambos campos se sobrescriben en el check-out. Para solucionar esto, lo ideal sería tener campos separados para la ubicación de entrada y salida (por ejemplo, latitudEntrada, longitudEntrada, latitudSalida, longitudSalida) para conservar ambas ubicaciones y poder mostrarlas correctamente en el historial filtrado por fechas.
   * * * ATENCIÓN A LA VALIDACIÓN DE FECHAS: Es importante validar que las fechas 'desde' y 'hasta' sean válidas y que 'desde' no sea posterior a 'hasta'. Esto se puede hacer en el controlador antes de llamar al servicio, lanzando una excepción si las fechas no son válidas o si el rango es incorrecto. Esto garantiza que el servicio reciba datos correctos y evita errores en la consulta a la base de datos.
   * * * ATENCIÓN AL AJUSTE DE HORAS EN EL RANGO DE FECHAS: Para asegurarse de que el rango de fechas incluya todas las jornadas del día 'hasta', es recomendable ajustar la fecha 'hasta' para que termine a las 23:59:59 del día final. De esta manera, se incluirán todas las jornadas que se iniciaron en el día 'hasta', incluso aquellas que se iniciaron al final del día. Esto se puede hacer en el servicio antes de realizar la consulta a la base de datos, ajustando la fecha 'hasta' con setHours(23, 59, 59, 999) para incluir todo el día.
   * * * ATENCIÓN AL AJUSTE DE HORAS EN EL RANGO DE FECHAS (PARTE 2): De manera similar, es recomendable ajustar la fecha 'desde' para que comience a las 00:00:00 del día inicial. Esto garantiza que se incluyan todas las jornadas que se iniciaron en el día 'desde', incluso aquellas que se iniciaron al principio del día. Esto se puede hacer en el servicio antes de realizar la consulta a la base de datos, ajustando la fecha 'desde' con setHours(0, 0, 0, 0) para incluir todo el día.
   * * * ATENCIÓN AL BUG DE LAS RELACIONES EN EL RANGO DE FECHAS: Al obtener las jornadas por rango de fechas, es importante cargar solo las relaciones necesarias para evitar sobrecargar la consulta. En este caso, si solo necesitas mostrar información básica de la empresa en el historial filtrado, puedes cargar solo la relación con la empresa utilizando relations: ['empresa'] en la consulta. Esto mejora el rendimiento al no cargar relaciones innecesarias como el usuario completo, y aún así permite mostrar información relevante de la empresa asociada a cada jornada.
   * * * Este método es especialmente útil para generar reportes o visualizar el historial de trabajo en períodos específicos, lo que puede ser importante para la gestión de recursos humanos o para que los empleados revisen su propio historial de jornadas laborales.
   */
  async findAllByRange(usuarioId: number, desde: Date, hasta: Date) {
    // Ajustamos 'hasta' para que incluya todo el día final (23:59:59)
    const fechaFin = new Date(hasta);
    fechaFin.setHours(23, 59, 59, 999);

    // Ajustamos 'desde' para que empiece a las 00:00:00 del día inicial
    const fechaInicio = new Date(desde);
    fechaInicio.setHours(0, 0, 0, 0);

    return await this.workdayRepository.find({
      where: { 
        usuario: { id: usuarioId },
        inicio: Between(fechaInicio, fechaFin) 
      },
      order: { inicio: 'DESC' },
      relations: ['empresa'],
      // 🛡️ Seleccionamos datos seguros
      select: {
        id: true, inicio: true, fin: true, total_minutos: true,
        latitudEntrada: true, longitudEntrada: true,
        latitudSalida: true, longitudSalida: true, modalidad: true,
        empresa: { id: true, nombre: true } // Evitamos traer CIF, datos de pago, etc.
      }
    });
  }

  // ============================================
  // MÉTODOS AUXILIARES (Lógica de negocio)
  // ============================================
  private obtenerDistribucionHoy(usuario: User) {
    const diaJS = new Date().getDay();
    const mapeoDias: Record<number, string> = { 1:'LUNES', 2:'MARTES', 3:'MIERCOLES', 4:'JUEVES', 5:'VIERNES', 6:'SABADO', 0:'DOMINGO' };
    return usuario?.horario?.distribuciones?.find(d => d.diaSemana === mapeoDias[diaJS]);
  }

  private comprobarRetraso(horaActual: Date, horaTeoricaStr: string, margenMins: number): boolean {
    const [h, m] = horaTeoricaStr.split(':').map(Number);
    const minutosTeoricos = (h * 60) + m + margenMins;
    const minutosActuales = (horaActual.getHours() * 60) + horaActual.getMinutes();
    return minutosActuales > minutosTeoricos;
  }

  private comprobarSalidaAnticipada(horaActual: Date, horaTeoricaFinStr: string, margenMins: number): boolean {
    const [h, m] = horaTeoricaFinStr.split(':').map(Number);
    const minutosTeoricos = (h * 60) + m - margenMins; 
    const minutosActuales = (horaActual.getHours() * 60) + horaActual.getMinutes();
    return minutosActuales < minutosTeoricos; 
  }

  private calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; 
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }


async getTodayStats(empresaId: number) {
  const inicioDia = new Date();
  inicioDia.setHours(0, 0, 0, 0);
  
  const finDia = new Date();
  finDia.setHours(23, 59, 59, 999);

  // 1. Contamos quiénes están trabajando (Check-in hecho, check-out pendiente)
  const activos = await this.workdayRepository.count({
    where: { 
      empresa: { id: empresaId }, 
      fin: IsNull(), 
      inicio: Between(inicioDia, finDia) 
    }
  });

  // 2. Contamos quiénes ya han terminado hoy
  const terminados = await this.workdayRepository.count({
    where: { 
      empresa: { id: empresaId }, 
      fin: Not(IsNull()), 
      inicio: Between(inicioDia, finDia) 
    }
  });

  // 3. Contamos las alarmas críticas sin revisar (usando el método que creamos antes)
  const alarmasCriticas = await this.alarmService.countPendingToday(empresaId);

  return {
    fecha: inicioDia.toLocaleDateString('es-ES'),
    stats: {
      trabajandoAhora: activos,
      jornadasFinalizadas: terminados,
      alertasPendientes: alarmasCriticas
    }
  };
}

}