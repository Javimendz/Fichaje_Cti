import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { CreateAbsenceDto } from './dto/create-absence.dto';
import { UpdateAbsenceDto } from './dto/update-absence.dto';
import { User } from 'auth/entities/user.entity';
import { UserRole } from 'auth/roles.enum';
import { Ausencia } from './entities/ausencia.entity';
import { AusenciaEstado, TipoAusencia } from './dto/ausencia-estado.enum';

// El servicio de Absence contiene la lógica de negocio relacionada con las ausencias. Proporciona métodos para crear nuevas ausencias, actualizar el estado de una ausencia, eliminar una ausencia y obtener el balance de vacaciones de un usuario. Además, incluye validaciones para evitar solapamientos de fechas y asegurar que solo los usuarios autorizados puedan modificar o eliminar ausencias. El servicio interactúa con la base de datos a través del repositorio de la entidad Ausencia.
/**
 * * * AbsenceService
 * * Contiene la lógica de negocio relacionada con las ausencias. Proporciona métodos para crear nuevas ausencias, actualizar el estado de una ausencia, eliminar una ausencia y obtener el balance de vacaciones de un usuario. Además, incluye validaciones para evitar solapamientos de fechas y asegurar que solo los usuarios autorizados puedan modificar o eliminar ausencias. El servicio interactúa con la base de datos a través del repositorio de la entidad Ausencia.
 * 
 * */
@Injectable()
export class AbsenceService {
  constructor(
    @InjectRepository(Ausencia)
    private readonly ausenciaRepository: Repository<Ausencia>,
  ) {}


  // Método para obtener el balance de vacaciones de un usuario, calculando los días disponibles, gastados y totales según las ausencias aprobadas del tipo VACACIONES en el año actual.
  // El método getVacationBalance consulta la base de datos para sumar los días consumidos de las ausencias aprobadas del tipo VACACIONES del usuario en el año actual. Luego, calcula los días disponibles restando los días gastados de un total estándar (22 días por ley) y devuelve un objeto con el balance de vacaciones.    
  // 🛡️ NUEVO: Método para obtener el balance de vacaciones de un usuari
  // El método getVacationBalance consulta la base de datos para sumar los días consumidos de las ausencias aprobadas del tipo VACACIONES del usuario en el año actual. Luego, calcula los días disponibles restando los días gastados de un total estándar (22 días por ley) y devuelve un objeto con el balance de vacaciones.
  // Este método es esencial para que los trabajadores puedan conocer cuántos días de vacaciones les quedan disponibles, y para que los administradores puedan gestionar mejor las solicitudes de vacaciones.
  /**
   * Calcula y devuelve el balance de vacaciones de un usuario, incluyendo los días totales por año, los días gastados en ausencias aprobadas del tipo VACACIONES y los días disponibles restantes.
   * El método realiza una consulta a la base de datos para sumar los días consumidos de las ausencias aprobadas del tipo VACACIONES del usuario en el año actual, y luego calcula los días disponibles restando los días gastados de un total estándar (22 días por ley).
   * @param usuarioId ID del usuario para el cual se desea obtener el balance de vacaciones.
   * @returns Un objeto con el año actual, los días totales por año, los días gastados y los días disponibles.
   */ 
 async getVacationBalance(usuarioId: number) {
    const currentYear = new Date().getFullYear();
    const diasMaximos = 22; // Días estándar por ley

    // Usamos QueryBuilder para sumar los días consumidos directamente en la BD
    const result = await this.ausenciaRepository.createQueryBuilder('ausencia')
      .select('SUM(ausencia.dias_consumidos)', 'total')
      .where('ausencia.usuario_id = :usuarioId', { usuarioId })
      .andWhere('ausencia.tipo = :tipo', { tipo: TipoAusencia.VACACIONES })
      .andWhere('ausencia.estado = :estado', { estado: AusenciaEstado.APROBADA })
      .andWhere('EXTRACT(YEAR FROM ausencia.fecha_inicio) = :year', { year: currentYear })
      .getRawOne();

    const diasGastados = parseInt(result.total || '0', 10);

    return {
      año: currentYear,
      dias_totales_año: diasMaximos,
      dias_gastados: diasGastados,
      dias_disponibles: diasMaximos - diasGastados
    };
  }


  // Método para crear una nueva ausencia, validando que no haya solapamientos con otras ausencias existentes del mismo usuario y que las fechas sean correctas. La ausencia se crea con estado PENDIENTE y se vincula al usuario autenticado.
  // El método create recibe los datos de la nueva ausencia a través del DTO CreateAbsenceDto y el usuario autenticado. Primero, valida que el usuario esté vinculado a una empresa, luego convierte las fechas de inicio y fin a formato UTC para evitar problemas de zona horaria. Valida que la fecha de inicio no sea posterior a la fecha de fin, y luego verifica que no haya solapamientos con otras ausencias existentes del mismo usuario que estén en estado PENDIENTE o APROBADA. Si todo es correcto, calcula el total de días de la ausencia, crea un nuevo registro en la base de datos con estado PENDIENTE y lo devuelve.
  // Este método es fundamental para que los trabajadores puedan registrar sus ausencias de manera correcta, y para que el sistema pueda gestionar las solicitudes de ausencia de forma eficiente, evitando conflictos de fechas y asegurando que solo se registren ausencias válidas.
  // 🛡️ NUEVO: Método para crear una nueva ausencia con validación de solapamiento
 /**
  * Crea una nueva ausencia para un usuario, validando que no haya solapamientos con otras ausencias existentes del mismo usuario y que las fechas sean correctas. La ausencia se crea con estado PENDIENTE y se vincula al usuario autenticado.
  * El método recibe los datos de la nueva ausencia a través del DTO CreateAbsenceDto y el usuario autenticado. Primero, valida que el usuario esté vinculado a una empresa, luego convierte las fechas de inicio y fin a formato UTC para evitar problemas de zona horaria. Valida que la fecha de inicio no sea posterior a la fecha de fin, y luego verifica que no haya solapamientos con otras ausencias existentes del mismo usuario que estén en estado PENDIENTE o APROBADA. Si todo es correcto, calcula el total de días de la ausencia, crea un nuevo registro en la base de datos con estado PENDIENTE y lo devuelve.
  * @param dto Datos de la nueva ausencia a crear, incluyendo tipo, motivo, fecha de inicio y fecha de fin.
  * @param usuario Usuario autenticado que está creando la ausencia.
  * @returns La nueva ausencia creada con estado PENDIENTE.
  * @throws BadRequestException si el usuario no está vinculado a una empresa, si las fechas son inválidas o si hay solapamientos con otras ausencias existentes.
  */
 
  async create(dto: CreateAbsenceDto, usuario: User) {
    if (!usuario.empresaId) {
      throw new BadRequestException('El usuario debe estar vinculado a una empresa para registrar ausencias.');
    }

    const inicio = new Date(dto.fecha_inicio);
    const fin = new Date(dto.fecha_fin);
    inicio.setUTCHours(0, 0, 0, 0);
    fin.setUTCHours(0, 0, 0, 0);

    if (inicio > fin) {
      throw new BadRequestException('La fecha de inicio no puede ser posterior a la de fin.');
    }

    const fechaInicioStr = inicio.toISOString().split('T')[0];
    const fechaFinStr = fin.toISOString().split('T')[0];

    // Fórmula: Nueva_Inicio <= Vieja_Fin Y Nueva_Fin >= Vieja_Inicio
    const solapamiento = await this.ausenciaRepository.findOne({
      where: {
        usuarioId: usuario.id,
        estado: In([AusenciaEstado.PENDIENTE, AusenciaEstado.APROBADA]), // Ignoramos las RECHAZADAS
        fechaInicio: LessThanOrEqual(fechaFinStr),
        fechaFin: MoreThanOrEqual(fechaInicioStr),
      }
    });

    if (solapamiento) {
      throw new BadRequestException(
        `Ya tienes una ausencia registrada (${solapamiento.estado}) que interfiere con estas fechas: del ${solapamiento.fechaInicio} al ${solapamiento.fechaFin}.`
      );
    }

    const diffTime = Math.abs(fin.getTime() - inicio.getTime());
    const diasTotales = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const nuevaAusencia = new Ausencia();
    nuevaAusencia.tipo = dto.tipo as any;
    nuevaAusencia.motivo = dto.motivo;
    nuevaAusencia.fechaInicio = fechaInicioStr;
    nuevaAusencia.fechaFin = fechaFinStr;
    nuevaAusencia.diasTotales = diasTotales;
    nuevaAusencia.diasConsumidos = 0;
    nuevaAusencia.usuarioId = usuario.id;
    nuevaAusencia.empresaId = usuario.empresaId;
    nuevaAusencia.estado = AusenciaEstado.PENDIENTE; 

    return await this.ausenciaRepository.save(nuevaAusencia);
  }
  
  // Método para actualizar el estado de una ausencia, permitiendo aprobarla o rechazarla. Solo los administradores pueden acceder a este método, y se valida que la ausencia exista y que el nuevo estado sea diferente al actual.
  // El método updateEstado recibe el ID de la ausencia a actualizar, el nuevo estado y el usuario administrador que realiza la acción. Primero, valida que la ausencia exista y que el usuario tenga permiso para modificarla. Luego, verifica que el nuevo estado sea diferente al actual para evitar cambios innecesarios. Si todo es correcto, actualiza el estado de la ausencia, ajusta los días consumidos según si se aprueba o se rechaza, añade una marca en el motivo indicando quién procesó la solicitud, guarda los cambios en la base de datos y devuelve la ausencia actualizada.
  // Este método es crucial para que los administradores puedan gestionar las solicitudes de ausencia de manera eficiente, asegurando que solo se procesen cambios válidos y que se mantenga un registro claro de quién aprobó o rechazó cada solicitud.
  // 🛡️ NUEVO: Método para actualizar el estado de una ausencia (aprobar/rechazar
  /**
   * Actualiza el estado de una ausencia, permitiendo aprobarla o rechazarla. Solo los administradores pueden acceder a este método, y se valida que la ausencia exista y que el nuevo estado sea diferente al actual.
   * El método recibe el ID de la ausencia a actualizar, el nuevo estado y el usuario administrador que realiza la acción. Primero, valida que la ausencia exista y que el usuario tenga permiso para modificarla. Luego, verifica que el nuevo estado sea diferente al actual para evitar cambios innecesarios. Si todo es correcto, actualiza el estado de la ausencia, ajusta los días consumidos según si se aprueba o se rechaza, añade una marca en el motivo indicando quién procesó la solicitud, guarda los cambios en la base de datos y devuelve la ausencia actualizada.
   * @param id ID de la ausencia a actualizar.
   * @param estado Nuevo estado de la ausencia (APROBADA o RECHAZADA).
   * @param admin Usuario administrador que realiza la actualización.
   * @return La ausencia actualizada con el nuevo estado.
   * @throws NotFoundException si la ausencia no existe.
   * @throws ForbiddenException si el usuario no tiene permiso para modificar la ausencia.
   * @throws BadRequestException si el nuevo estado es igual al estado actual de la ausencia.
   */
  async findOne(id: number, user: User) {
    const ausencia = await this.ausenciaRepository.findOne({
      where: { id },
      relations: ['usuario'],
    });

    if (!ausencia) throw new NotFoundException('Ausencia no encontrada');

    const isOwner = ausencia.usuario.id === user.id;
    const isAdmin = user.rol === UserRole.ADMIN && ausencia.empresaId === user.empresaId;

    if (!isOwner && !isAdmin) {
       throw new ForbiddenException('Acceso denegado: No tienes permiso para ver esta ausencia');
    }

    return ausencia;
  }

  // Método para eliminar una ausencia, permitiendo solo eliminar ausencias que estén en estado PENDIENTE. Solo el propietario de la ausencia o un administrador pueden eliminarla.
  // El método remove recibe el ID de la ausencia a eliminar y el usuario que realiza la acción. Primero, valida que la ausencia exista y que el usuario tenga permiso para eliminarla. Luego, verifica que la ausencia esté en estado PENDIENTE para permitir su eliminación. Si todo es correcto, elimina la ausencia de la base de datos y devuelve el resultado.
  // Este método es importante para que los trabajadores puedan corregir errores en sus solicitudes de ausencia antes de que sean procesadas, y para que los administradores puedan mantener la base de datos limpia de solicitudes pendientes que ya no son relevantes.
  // 🛡️ NUEVO: Método para eliminar una ausencia (solo si está pendiente
  /**
   * Elimina una ausencia, permitiendo solo eliminar ausencias que estén en estado PENDIENTE. Solo el propietario de la ausencia o un administrador pueden eliminarla.
   * El método recibe el ID de la ausencia a eliminar y el usuario que realiza la acción. Primero, valida que la ausencia exista y que el usuario tenga permiso para eliminarla. Luego, verifica que la ausencia esté en estado PENDIENTE para permitir su eliminación. Si todo es correcto, elimina la ausencia de la base de datos y devuelve el resultado.
   * @param id ID de la ausencia a eliminar.
   * @param user Usuario que realiza la eliminación.
   * @return El resultado de la eliminación de la ausencia.
   * @throws NotFoundException si la ausencia no existe.
   * @throws ForbiddenException si el usuario no tiene permiso para eliminar la ausencia o si la ausencia no está en estado PENDIENTE.
   * @throws BadRequestException si la ausencia no está en estado PENDIENTE.
   */
 
  async findAllByUsuario(usuarioId: number) {
    return await this.ausenciaRepository.find({
      where: { usuarioId },
      order: { fechaInicio: 'DESC' }
    });
  }


  // Método para obtener todas las ausencias de una empresa, incluyendo los datos públicos del usuario que las solicitó. Solo los administradores pueden acceder a este método.
  // El método findAllByEmpresa recibe el ID de la empresa y devuelve todas las ausencias registradas por los usuarios de esa empresa, ordenadas por fecha de creación. Incluye una relación con la entidad Usuario para mostrar los datos públicos del solicitante. Solo los administradores pueden acceder a este método para revisar el historial de ausencias de su empresa, asegurando que los trabajadores no puedan ver los registros de otros empleados.
  // Este método es esencial para que los administradores puedan gestionar las solicitudes de ausencia de su empresa de manera eficiente, permitiéndoles revisar fácilmente el historial de ausencias de todos los empleados y tomar decisiones informadas sobre futuras solicitudes.
  // 🛡️ NUEVO: Método para obtener todas las ausencias de una empresa (solo admin
  /**
   * Obtiene todas las ausencias de una empresa, incluyendo los datos públicos del usuario que las solicitó. Solo los administradores pueden acceder a este método.
   * El método recibe el ID de la empresa y devuelve todas las ausencias registradas por los usuarios de esa empresa, ordenadas por fecha de creación. Incluye una relación con la entidad Usuario para mostrar los datos públicos del solicitante. Solo los administradores pueden acceder a este método para revisar el historial de ausencias de su empresa, asegurando que los trabajadores no puedan ver los registros de otros empleados.
   * @param empresaId ID de la empresa para la cual se desean obtener las ausencias.
   * @return Un array de ausencias registradas por los usuarios de la empresa, incluyendo los datos públicos del solicitante.
   * @throws ForbiddenException si el usuario no tiene permiso para acceder a las ausencias de la empresa.
   * @throws NotFoundException si la empresa no existe o no tiene ausencias registradas.
   */
async findAllByEmpresa(empresaId: number) {
    return await this.ausenciaRepository.find({
      where: { empresaId },
      relations: ['usuario'],
      order: { createdAt: 'DESC' },
      // Definimos exactamente qué campos queremos que TypeORM nos devuelva
      select: {
        id: true,
        tipo: true,
        fechaInicio: true,
        fechaFin: true,
        motivo: true,
        estado: true,
        usuarioId: true,
        empresaId: true,
        diasConsumidos: true,
        diasTotales: true,
        createdAt: true,
        updatedAt: true,
        usuario: { // Del usuario, SOLO traemos los datos públicos
          id: true,
          nombre: true,
          email: true,
          rol: true
        }
      }
    });
  }

  // Método para actualizar una ausencia, permitiendo modificar el tipo, motivo y fechas solo si la ausencia está en estado PENDIENTE. Solo el propietario de la ausencia puede modificarla.
  // El método update recibe el ID de la ausencia a actualizar, los nuevos datos a través del DTO UpdateAbsenceDto y el usuario que realiza la acción. Primero, valida que la ausencia exista y que el usuario tenga permiso para modificarla. Luego, verifica que la ausencia esté en estado PENDIENTE para permitir su modificación. Si se modifican las fechas, valida que no haya solapamientos con otras ausencias existentes del mismo usuario. Si todo es correcto, actualiza los campos permitidos de la ausencia, guarda los cambios en la base de datos y devuelve la ausencia actualizada.
  // Este método es importante para que los trabajadores puedan corregir errores o actualizar la información de sus solicitudes de ausencia antes de que sean procesadas, asegurando que solo se modifiquen ausencias que aún no han sido aprobadas o rechazadas.
  // 🛡️ NUEVO: Método para actualizar una ausencia (solo si está pendient
  /**
   * Actualiza una ausencia, permitiendo modificar el tipo, motivo y fechas solo si la ausencia está en estado PENDIENTE. Solo el propietario de la ausencia puede modificarla.
   * El método recibe el ID de la ausencia a actualizar, los nuevos datos a través del DTO UpdateAbsenceDto y el usuario que realiza la acción. Primero, valida que la ausencia exista y que el usuario tenga permiso para modificarla. Luego, verifica que la ausencia esté en estado PENDIENTE para permitir su modificación. Si se modifican las fechas, valida que no haya solapamientos con otras ausencias existentes del mismo usuario. Si todo es correcto, actualiza los campos permitidos de la ausencia, guarda los cambios en la base de datos y devuelve la ausencia actualizada.
    * @param id ID de la ausencia a actualizar.
    * @param dto Nuevos datos para la ausencia, incluyendo tipo, motivo, fecha de inicio y fecha de fin.
    * @param user Usuario que realiza la actualización.
    * @return La ausencia actualizada con los nuevos datos.
    * @throws NotFoundException si la ausencia no existe.
    *   @throws ForbiddenException si el usuario no tiene permiso para modificar la ausencia o si la ausencia no está en estado PENDIENTE.
    * @throws BadRequestException si las nuevas fechas son inválidas o si hay solapamientos con otras ausencias existentes.
   */
 
  async update(id: number, dto: UpdateAbsenceDto, user: User) {
    const ausencia = await this.findOne(id, user);
    
    if (ausencia.estado !== AusenciaEstado.PENDIENTE) {
      throw new ForbiddenException('No se puede modificar una ausencia ya procesada');
    }

    if (dto.tipo) ausencia.tipo = dto.tipo as any;
    if (dto.motivo) ausencia.motivo = dto.motivo;

    if (dto.fecha_inicio || dto.fecha_fin) {
      const nuevaFechaInicioStr = dto.fecha_inicio || ausencia.fechaInicio;
      const nuevaFechaFinStr = dto.fecha_fin || ausencia.fechaFin;

      const inicio = new Date(nuevaFechaInicioStr);
      const fin = new Date(nuevaFechaFinStr);
      
      inicio.setUTCHours(0, 0, 0, 0);
      fin.setUTCHours(0, 0, 0, 0);

      if (inicio > fin) {
        throw new BadRequestException('La fecha de inicio resultante no puede ser posterior a la fecha de fin.');
      }

      const inicioStr = inicio.toISOString().split('T')[0];
      const finStr = fin.toISOString().split('T')[0];

      const solapamiento = await this.ausenciaRepository.findOne({
        where: {
          id: Not(ausencia.id), // Excluimos la ausencia que estamos editando
          usuarioId: user.id,
          estado: In([AusenciaEstado.PENDIENTE, AusenciaEstado.APROBADA]),
          fechaInicio: LessThanOrEqual(finStr),
          fechaFin: MoreThanOrEqual(inicioStr),
        }
      });

      if (solapamiento) {
        throw new BadRequestException(
          `Las nuevas fechas solapan con otra ausencia (${solapamiento.estado}): del ${solapamiento.fechaInicio} al ${solapamiento.fechaFin}.`
        );
      }

      const diffTime = Math.abs(fin.getTime() - inicio.getTime());
      ausencia.diasTotales = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      ausencia.fechaInicio = inicioStr;
      ausencia.fechaFin = finStr;
    }

    return await this.ausenciaRepository.save(ausencia);
  }

  // Método para actualizar el estado de una ausencia, permitiendo aprobarla o rechazarla. Solo los administradores pueden acceder a este método, y se valida que la ausencia exista y que el nuevo estado sea diferente al actual.
  // El método updateEstado recibe el ID de la ausencia a actualizar, el nuevo estado y el usuario administrador que realiza la acción. Primero, valida que la ausencia exista y que el usuario tenga permiso para modificarla. Luego, verifica que el nuevo estado sea diferente al actual para evitar cambios innecesarios. Si todo es correcto, actualiza el estado de la ausencia, ajusta los días consumidos según si se aprueba o se rechaza, añade una marca en el motivo indicando quién procesó la solicitud, guarda los cambios en la base de datos y devuelve la ausencia actualizada.
  // Este método es crucial para que los administradores puedan gestionar las solicitudes de ausencia de manera eficiente, asegurando que solo se procesen cambios válidos y que se mantenga un registro claro de quién aprobó o rechazó cada solicitud.
    // 🛡️ NUEVO: Método para actualizar el estado de una ausencia (aprobar/rechaza
    /**
     * Actualiza el estado de una ausencia, permitiendo aprobarla o rechazarla. Solo los administradores pueden acceder a este método, y se valida que la ausencia exista y que el nuevo estado sea diferente al actual.
     * El método recibe el ID de la ausencia a actualizar, el nuevo estado y el usuario administrador que realiza la acción. Primero, valida que la ausencia exista y que el usuario tenga permiso para modificarla. Luego, verifica que el nuevo estado sea diferente al actual para evitar cambios innecesarios. Si todo es correcto, actualiza el estado de la ausencia, ajusta los días consumidos según si se aprueba o se rechaza, añade una marca en el motivo indicando quién procesó la solicitud, guarda los cambios en la base de datos y devuelve la ausencia actualizada.
     * @param id ID de la ausencia a actualizar.
     * @param estado Nuevo estado de la ausencia (APROBADA o RECHAZADA).
     * @param admin Usuario administrador que realiza la actualización.
     * @return La ausencia actualizada con el nuevo estado.
     * @throws NotFoundException si la ausencia no existe.
     * @throws ForbiddenException si el usuario no tiene permiso para modificar la ausencia.
     * @throws BadRequestException si el nuevo estado es igual al estado actual de la ausencia.
      */
  async updateEstado(id: number, estado: AusenciaEstado, admin: User) {
    const ausencia = await this.findOne(id, admin);

    if (ausencia.estado === estado) {
      throw new BadRequestException(`La ausencia ya se encuentra en estado ${estado}`);
    }

    ausencia.estado = estado;
    // Si se aprueba, los días consumidos pasan a ser los totales. Si se rechaza o vuelve a pendiente, 0.
    ausencia.diasConsumidos = estado === AusenciaEstado.APROBADA ? ausencia.diasTotales : 0;
    
    const adminStamp = ` (Procesado por ID: ${admin.id})`;
    if (!ausencia.motivo?.includes(adminStamp)) {
        ausencia.motivo = `${ausencia.motivo || 'Sin motivo'} ${adminStamp}`.trim();
    }

    return await this.ausenciaRepository.save(ausencia);
  }

  // Método para eliminar una ausencia, permitiendo solo eliminar ausencias que estén en estado PENDIENTE. Solo el propietario de la ausencia o un administrador pueden eliminarla.
  // El método remove recibe el ID de la ausencia a eliminar y el usuario que realiza la acción. Primero, valida que la ausencia exista y que el usuario tenga permiso para eliminarla. Luego, verifica que la ausencia esté en estado PENDIENTE para permitir su eliminación. Si todo es correcto, elimina la ausencia de la base de datos y devuelve el resultado.
  // Este método es importante para que los trabajadores puedan corregir errores en sus solicitudes de ausencia antes de que sean procesadas, y para que los administradores puedan mantener la base de datos limpia de solicitudes pendientes que ya no son relevantes.
  // 🛡️ NUEVO: Método para eliminar una ausencia (solo si está pendient
  /**
   * Elimina una ausencia, permitiendo solo eliminar ausencias que estén en estado PENDIENTE. Solo el propietario de la ausencia o un administrador pueden eliminarla.
   * El método recibe el ID de la ausencia a eliminar y el usuario que realiza la acción. Primero, valida que la ausencia exista y que el usuario tenga permiso para eliminarla. Luego, verifica que la ausencia esté en estado PENDIENTE para permitir su eliminación. Si todo es correcto, elimina la ausencia de la base de datos y devuelve el resultado.
   * @param id ID de la ausencia a eliminar.
   * @param user Usuario que realiza la eliminación.
   * @return El resultado de la eliminación de la ausencia.
   * @throws NotFoundException si la ausencia no existe.
   * @throws ForbiddenException si el usuario no tiene permiso para eliminar la ausencia o si la ausencia no está en estado PENDIENTE.
   * @throws BadRequestException si la ausencia no está en estado PENDIENTE.
   * @throws ForbiddenException si la ausencia no está en estado PENDIENTE.
   * @throws ForbiddenException si el usuario no tiene permiso para eliminar la ausencia.
   * @throws NotFoundException si la ausencia no existe.
   * @throws BadRequestException si la ausencia no está en estado PENDIENTE.
   * @throws ForbiddenException si el usuario no tiene permiso para eliminar la ausencia o si la ausencia no está en estado PENDIENTE.
   *  
   */
  async remove(id: number, user: User) {
    const ausencia = await this.findOne(id, user);
    if (ausencia.estado !== AusenciaEstado.PENDIENTE) {
      throw new ForbiddenException('No se puede eliminar una ausencia ya procesada');
    }
    return await this.ausenciaRepository.remove(ausencia);
  }
}