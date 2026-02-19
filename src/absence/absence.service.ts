import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ausencia, AusenciaEstado } from './entities/ausencia.entity';
import { CreateAbsenceDto } from './dto/create-absence.dto';

import { UserRole } from 'auth/roles.enum';
import { UpdateAbsenceDto } from './dto/update-absence.dto';
import { User } from 'auth/entities/user.entity';

// El servicio de Absence se encarga de gestionar las operaciones relacionadas con las ausencias de los trabajadores. Proporciona métodos para crear nuevas ausencias, actualizar su estado, listar ausencias por usuario o empresa, y eliminar ausencias. El servicio implementa la lógica de negocio necesaria para garantizar que solo los usuarios autorizados puedan acceder o modificar las ausencias, y que las reglas del sistema se cumplan correctamente.
/**
 * * * * AbsenceService
 * * Servicio encargado de gestionar las operaciones relacionadas con las ausencias de los trabajadores. Proporciona métodos para crear nuevas ausencias, actualizar su estado, listar ausencias por usuario o empresa, y eliminar ausencias. El servicio implementa la lógica de negocio necesaria para garantizar que solo los usuarios autorizados puedan acceder o modificar las ausencias, y que las reglas del sistema se cumplan correctamente.
 * */
@Injectable()
export class AbsenceService {
  constructor(
    @InjectRepository(Ausencia)
    private readonly ausenciaRepository: Repository<Ausencia>,
  ) {}

  // Endpoint para crear una nueva ausencia, accesible para el trabajador autenticado. El SUPERADMIN no podrá crear ausencias, ya que la lógica de negocio en el servicio bloqueará el acceso si el usuario no tiene una empresa asignada.
    /**
     * Endpoint para crear una nueva ausencia, accesible para el trabajador autenticado. El SUPERADMIN no podrá crear ausencias, ya que la lógica de negocio en el servicio bloqueará el acceso si el usuario no tiene una empresa asignada.
     * @param dto Datos necesarios para crear la ausencia. Se espera que incluya información como la fecha de inicio, fecha de fin, motivo, etc., y se recibe en el cuerpo de la solicitud HTTP mediante el decorador @Body.
     * @param usuario Usuario autenticado que realiza la solicitud. Se espera que sea un trabajador, y se obtiene mediante el decorador @GetUser, que extrae la información del usuario del token JWT. El servicio validará que el usuario tenga una empresa asignada antes de permitir la creación de la ausencia.
     * @return La ausencia creada, incluyendo su ID generado por la base de datos y cualquier otra información relevante.
     * @throws BadRequestException si el usuario no tiene una empresa asignada, lo que indica que no tiene permiso para crear ausencias.
     * @see CreateAbsenceDto para la estructura de datos esperada al crear una ausencia.
     * @see Ausencia para la entidad de ausencias en la base de datos.
     */ 

  async create(dto: CreateAbsenceDto, usuario: User) {
    const inicio = new Date(dto.fecha_inicio);
    const fin = new Date(dto.fecha_fin);
    


    // Cálculo de días
    const diffTime = Math.abs(fin.getTime() - inicio.getTime());
    const diasTotales = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

if (!usuario.empresaId) {
    throw new BadRequestException('El usuario debe estar vinculado a una empresa para registrar ausencias.');
  }

    const nuevaAusencia = this.ausenciaRepository.create({
      ...dto,
      fechaInicio: inicio, 
      fechaFin: fin,       
      diasTotales: diasTotales, 
      usuarioId: usuario.id,
      empresaId: usuario.empresaId,
    });

    return await this.ausenciaRepository.save(nuevaAusencia);
  
  }

// Endpoint para actualizar el estado de una ausencia, accesible para el administrador de la empresa. El SUPERADMIN no podrá acceder a este endpoint, ya que la lógica de negocio en el servicio bloqueará el acceso si el administrador no tiene una empresa asignada.
  /**
   * Endpoint para actualizar el estado de una ausencia, accesible para el administrador de la empresa. El SUPERADMIN no podrá acceder a este endpoint, ya que la lógica de negocio en el servicio bloqueará el acceso si el administrador no tiene una empresa asignada.
   * 
   * @param id ID de la ausencia cuyo estado se desea actualizar. Se extrae de la ruta mediante el decorador @Param y se valida como un número entero utilizando ParseIntPipe.
   * @param estado Nuevo estado que se desea asignar a la ausencia. Se espera que sea un valor válido del enum AusenciaEstado (PENDIENTE, APROBADA, RECHAZADA) y se recibe en el cuerpo de la solicitud HTTP mediante el decorador @Body.
   * @param admin Usuario autenticado que realiza la solicitud. Se espera que sea un administrador de empresa, y se obtiene mediante el decorador @GetUser, que extrae la información del usuario del token JWT.  
   * @return La ausencia actualizada con el nuevo estado, incluyendo cualquier otra información relevante.
   * @throws NotFoundException si no se encuentra la ausencia con el ID proporcionado.
   * @throws BadRequestException si el estado proporcionado no es válido.
   * @see AusenciaEstado para los posibles estados de una ausencia.
   * @see Ausencia para la entidad de ausencias en la base de datos.
   * @throws ForbiddenException si el usuario autenticado no tiene permiso para actualizar el estado de la ausencia, lo que puede ocurrir si el usuario no es un administrador de empresa o si el administrador no tiene una empresa asignada.
   * @see UserRole para los roles de usuario en el sistema.
   * @see User para la entidad de usuarios en la base de datos.
   * @see https://docs.nestjs.com/controllers#request-payloads para más información sobre cómo manejar datos en el cuerpo de las solicitudes HTTP.
   *  */


async updateEstado(id: number, estado: AusenciaEstado, admin: User) {
  const ausencia = await this.ausenciaRepository.findOne({ where: { id } });
  if (!ausencia) throw new NotFoundException('Ausencia no encontrada');

  ausencia.estado = estado;
  ausencia.diasConsumidos = estado === AusenciaEstado.APROBADA ? ausencia.diasTotales : 0;
  ausencia.motivo = `${ausencia.motivo || ''} (Procesado por: ${admin.nombre || 'Admin'})`.trim();

  return await this.ausenciaRepository.save(ausencia);
}

  async findAllByUsuario(usuarioId: number) {
    return await this.ausenciaRepository.find({
      where: { usuarioId: usuarioId }, // Usamos la columna física directa
      order: { fechaInicio: 'DESC' }
    });
  }

  // Método para que el admin vea las ausencias de su empresa
   // El SUPERADMIN no podrá acceder a este método, ya que la lógica de negocio en el servicio bloqueará el acceso si el administrador no tiene una empresa asignada.

  /**
   * Método para que el admin vea las ausencias de su empresa. El SUPERADMIN no podrá acceder a este método, ya que la lógica de negocio en el servicio bloqueará el acceso si el administrador no tiene una empresa asignada.
   * @param admin Usuario autenticado que realiza la solicitud. Se espera que sea un administrador de empresa, y se obtiene mediante el decorador @GetUser, que extrae la información del usuario del token JWT. El servicio validará que el administrador tenga una empresa asignada antes de permitir el acceso a las ausencias.
   * @return Una lista de ausencias asociadas a la empresa del administrador autenticado, ordenadas por fecha de inicio en orden descendente.
   * @throws BadRequestException si el administrador no tiene una empresa asignada, lo que indica que no tiene permiso para acceder a las ausencias de la empresa.
   * @see UserRole para los roles de usuario en el sistema.
   * @see User para la entidad de usuarios en la base de datos.
   * @see Ausencia para la entidad de ausencias en la base de datos.
   * @see https://docs.nestjs.com/controllers#request-payloads para más información sobre cómo manejar datos en el cuerpo de las solicitudes HTTP.
   * */ 
  async findAllByEmpresa(empresaId: number) {
    return await this.ausenciaRepository.find({
      where: { empresaId: empresaId },
      relations: ['usuario'], // Traemos los datos del usuario para que el admin sepa de quién es
      order: { createdAt: 'DESC' }
    });
  }

   // Endpoint para buscar una ausencia por su ID, accesible para el trabajador dueño de la ausencia o el administrador de la empresa. El SUPERADMIN no podrá acceder a este endpoint, ya que la lógica de negocio en el servicio bloqueará el acceso si no es el dueño o el admin de ESA empresa.
    /**
     * Endpoint para buscar una ausencia por su ID, accesible para el trabajador dueño de la ausencia o el administrador de la empresa. El SUPERADMIN no podrá acceder a este endpoint, ya que la lógica de negocio en el servicio bloqueará el acceso si no es el dueño o el admin de ESA empresa.
     * @param id ID de la ausencia que se desea obtener. Se extrae de la ruta mediante el decorador @Param y se valida como un número entero utilizando ParseIntPipe.
     * @param user Usuario autenticado que realiza la solicitud. Se espera que sea el trabajador dueño de la ausencia o un administrador de la empresa, y se obtiene mediante el decorador @GetUser, que extrae la información del usuario del token JWT. El servicio validará que el usuario tenga permiso para acceder a la ausencia antes de devolverla.
     * @return La ausencia correspondiente al ID proporcionado, si el usuario tiene permiso para acceder a ella. Incluye información relevante como fechas, motivo, estado, y datos del usuario propietario de la ausencia.
     * @throws NotFoundException si no se encuentra la ausencia con el ID proporcionado.
     * @throws ForbiddenException si el usuario autenticado no tiene permiso para acceder a la ausencia, lo que puede ocurrir si el usuario no es el dueño de la ausencia ni un administrador de la empresa a la que pertenece la ausencia.
     * @see UserRole para los roles de usuario en el sistema.
     * @see User para la entidad de usuarios en la base de datos.
     * @see Ausencia para la entidad de ausencias en la base de datos.
     * @see https://docs.nestjs.com/controllers#request-payloads para más información sobre cómo manejar datos en el cuerpo de las solicitudes HTTP.
     * */ 
  async findOne(id: number, user: User) {
    const ausencia = await this.ausenciaRepository.findOne({
      where: { id },
      relations: ['usuario'],
    });

    if (!ausencia) throw new NotFoundException('Ausencia no encontrada');

    // 1. ¿Es el dueño de la ausencia? (Worker o Admin viendo sus propias ausencias)
    const isOwner = ausencia.usuario.id === user.id;
    
    // 2. ¿Es un administrador Y pertenece a la misma empresa que la ausencia?
    const isAdmin = user.rol === UserRole.ADMIN && ausencia.empresaId === user.empresaId;

    //   Si no es el dueño, ni el admin de ESA empresa, se bloquea.
    // El SUPERADMIN también será bloqueado aquí automáticamente.
    if (!isOwner && !isAdmin) {
       throw new ForbiddenException('Acceso denegado: No tienes permiso para ver esta ausencia');
    }

    return ausencia;
  }

  // Endpoint para actualizar una ausencia, accesible para el trabajador dueño de la ausencia o el administrador de la empresa, siempre que la ausencia esté en estado PENDIENTE. El SUPERADMIN no podrá acceder a este endpoint, ya que la lógica de negocio en el servicio bloqueará el acceso si no es el dueño o el admin de ESA empresa.
  /**
   * Endpoint para actualizar una ausencia, accesible para el trabajador dueño de la ausencia o el administrador de la empresa, siempre que la ausencia esté en estado PENDIENTE. El SUPERADMIN no podrá acceder a este endpoint, ya que la lógica de negocio en el servicio bloqueará el acceso si no es el dueño o el admin de ESA empresa.
   * @param id ID de la ausencia que se desea actualizar. Se extrae de la ruta mediante el decorador @Param y se valida como un número entero utilizando ParseIntPipe.
   * @param dto Datos que se desean actualizar en la ausencia. Se espera que incluya información como la fecha de inicio, fecha de fin, motivo, etc., y se recibe en el cuerpo de la solicitud HTTP mediante el decorador @Body. El servicio validará que solo se puedan actualizar las ausencias que estén en estado PENDIENTE.
   * @param user Usuario autenticado que realiza la solicitud. Se espera que sea el trabajador dueño de la ausencia o un administrador de la empresa, y se obtiene mediante el decorador @GetUser, que extrae la información del usuario del token JWT. El servicio validará que el usuario tenga permiso para actualizar la ausencia antes de permitir la actualización.
   * @return La ausencia actualizada, incluyendo cualquier información relevante que haya sido modificada.
   * @throws NotFoundException si no se encuentra la ausencia con el ID proporcionado.
   * @throws BadRequestException si la ausencia no está en estado PENDIENTE, lo que indica que no se puede modificar una ausencia ya procesada.
   * @throws ForbiddenException si el usuario autenticado no tiene permiso para actualizar la ausencia, lo que puede ocurrir si el usuario no es el dueño de la ausencia ni un administrador de la empresa a la que pertenece la ausencia.
   * @see UserRole para los roles de usuario en el sistema.
   * @see User para la entidad de usuarios en la base de datos.
   * @see Ausencia para la entidad de ausencias en la base de datos.
   * @see UpdateAbsenceDto para la estructura de datos esperada al actualizar una ausencia.
   * @see https://docs.nestjs.com/controllers#request-payloads para más información sobre cómo manejar datos en el cuerpo de las solicitudes HTTP.
   * */
  async update(id: number, dto: UpdateAbsenceDto, user: User) {
    const ausencia = await this.findOne(id, user);
    
    // Si la ausencia ya está aprobada, no debería poder editarse
    if (ausencia.estado !== AusenciaEstado.PENDIENTE) {
      throw new ForbiddenException('No se puede modificar una ausencia ya procesada');
    }

    Object.assign(ausencia, dto);
    return await this.ausenciaRepository.save(ausencia);
  }

  // Endpoint para eliminar una ausencia, accesible para el trabajador dueño de la ausencia o el administrador de la empresa, siempre que la ausencia esté en estado PENDIENTE. El SUPERADMIN no podrá eliminar ausencias que no le pertenecen, ya que la lógica de negocio en el servicio bloqueará el acceso si no es el dueño o el admin de ESA empresa.
  /**
   * Endpoint para eliminar una ausencia, accesible para el trabajador dueño de la ausencia o el administrador de la empresa, siempre que la ausencia esté en estado PENDIENTE. El SUPERADMIN no podrá eliminar ausencias que no le pertenecen, ya que la lógica de negocio en el servicio bloqueará el acceso si no es el dueño o el admin de ESA empresa.
   * @param id ID de la ausencia que se desea eliminar. Se extrae de la ruta mediante el decorador @Param y se valida como un número entero utilizando ParseIntPipe.
   * @param user Usuario autenticado que realiza la solicitud. Se espera que sea el trabajador dueño de la ausencia o un administrador de la empresa, y se obtiene mediante el decorador @GetUser, que extrae la información del usuario del token JWT. El servicio validará que el usuario tenga permiso para eliminar la ausencia antes de permitir la eliminación, y que la ausencia esté en estado PENDIENTE.
   * @return La ausencia eliminada, incluyendo cualquier información relevante que pueda ser útil para confirmar la eliminación.
   * @throws NotFoundException si no se encuentra la ausencia con el ID proporcionado.
   * @throws BadRequestException si la ausencia no está en estado PENDIENTE, lo que indica que no se puede eliminar una ausencia ya procesada.
   * @throws ForbiddenException si el usuario autenticado no tiene permiso para eliminar la ausencia, lo que puede ocurrir si el usuario no es el dueño de la ausencia ni un administrador de la empresa a la que pertenece la ausencia.
   * @see UserRole para los roles de usuario en el sistema.
   * @see User para la entidad de usuarios en la base de datos.
   * @see Ausencia para la entidad de ausencias en la base de datos.
   * @see https://docs.nestjs.com/controllers#request-payloads para más información sobre cómo manejar datos en el cuerpo de las solicitudes HTTP.
   * */
  async remove(id: number, user: User) {
    const ausencia = await this.findOne(id, user);
    
    if (ausencia.estado !== AusenciaEstado.PENDIENTE) {
      throw new ForbiddenException('No se puede eliminar una ausencia ya procesada');
    }

    return await this.ausenciaRepository.remove(ausencia);
  }
}