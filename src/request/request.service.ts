import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, DeepPartial, In, LessThanOrEqual, MoreThanOrEqual, Not, Repository } from "typeorm";
import { Request as SolicitudEntity } from './entities/request.entity';

import { RevisionRequest } from "./entities/revision-request.entity";
import { User } from "../auth/entities/user.entity";
import { CreateRequestDto } from "./dto/create-request.dto";
import { RevisarRequestDto, RequestStatus } from "./dto/revisar-request.dto";
import { Ausencia } from "absence/entities/ausencia.entity";
import { AusenciaEstado } from "absence/dto/ausencia-estado.enum";
import { UserPayload } from "auth/interfaces/user-payload.interface";
import { UserRole } from "auth/roles.enum";
import { BaseCleanupService } from "common/base/baseCleanup.service";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Company } from "company/entities/company.entity";
import { ConfigService } from "@nestjs/config";


/**
 * SolicitudesService
 *  Servicio encargado de gestionar las operaciones relacionadas con las solicitudes de los usuarios.
 * Proporciona métodos para crear nuevas solicitudes, revisar solicitudes existentes
 * y listar solicitudes por empresa y usuario.
 * Métodos principales:
 * - create: Crea una nueva solicitud para un usuario.
 * - revisar: Permite a un administrador revisar una solicitud, actualizando su estado y creando una ausencia si es aprobada.
 * - findAllByEmpresa: Lista todas las solicitudes asociadas a una empresa, con opción de filtrar por usuario.
 * @see Request para la entidad de solicitudes.
 * @see RevisionRequest para la entidad de revisiones de solicitudes.
 * @see Ausencia para la entidad de ausencias.
 * @see User para la entidad de usuarios.
 * @see CreateRequestDto para la estructura de datos al crear una solicitud.
 * @see RevisarRequestDto para la estructura de datos al revisar una solicitud.
 * @see https://docs.nestjs.com/providers
 * 
 */

@Injectable() // Marca la clase como un proveedor inyectable
export class SolicitudesService extends BaseCleanupService<SolicitudEntity> { // Definición del servicio SolicitudesService
  constructor(
    @InjectRepository(SolicitudEntity)
    private readonly solicitudRepo: Repository<SolicitudEntity>, // Repositorio para operaciones CRUD en Solicitud
    private readonly dataSource: DataSource, // Inyección
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Company) private readonly companyRepo: Repository<Company>,
    private readonly configService: ConfigService,
  ) { super(solicitudRepo, 'SOLICITUDES'); }


  /**
   *  Crea una nueva solicitud asociada al usuario que la realiza.
   *  
   * @param dto Datos necesarios para crear la solicitud. 
   * @param user Usuario que realiza la solicitud. 
   * @return La solicitud creada.
   * @throws BadRequestException si el usuario no tiene una empresa asignada.
   * @see CreateRequestDto
   * @see Request 
   */
  async create(dto: CreateRequestDto, user: UserPayload) {

    const solicitudesPendientes = await this.solicitudRepo.count({
      where: {
        usuarioId: user.id,
        estado: RequestStatus.PENDIENTE,
      },
    });

    if (solicitudesPendientes >= 3) {
      throw new BadRequestException(
        'Ya tienes 3 solicitudes pendientes. Debes esperar a que el administrador las acepte o deniegue antes de crear una nueva.'
      );
    }
    // 1. Validación de seguridad


    if (!user.empresaId) {
      throw new BadRequestException('El usuario no tiene una empresa asignada.');
    }
    const usuarioCompleto = await this.userRepo.findOne({
      where: { id: user.id }
    });
    if (!usuarioCompleto) throw new NotFoundException('Usuario no encontrado');
    // 2. Normalización de fechas (Importante para evitar errores de horas/milisegundos)
    const inicioNuevo = new Date(dto.fechaInicio);
    const finNuevo = new Date(dto.fechaFin);

    inicioNuevo.setHours(0, 0, 0, 0);
    finNuevo.setHours(23, 59, 59, 999);

    if (inicioNuevo > finNuevo) {
      throw new BadRequestException('La fecha de fin no puede ser anterior a la de inicio.');
    }

    // 3. Validación de Solapamiento (Overlap)
    // Usamos las variables normalizadas para asegurar una comparación de días exactos
    const solicitudExistente = await this.solicitudRepo.findOne({
      where: {
        usuarioId: user.id,
        estado: RequestStatus.APROBADA,
        fechaInicio: LessThanOrEqual(finNuevo),
        fechaFin: MoreThanOrEqual(inicioNuevo),
      },
    });

    if (solicitudExistente) {
      const fI = new Date(solicitudExistente.fechaInicio).toLocaleDateString();
      const fF = new Date(solicitudExistente.fechaFin).toLocaleDateString();
      throw new BadRequestException(
        `Ya tienes una solicitud APROBADA en este periodo (${fI} al ${fF}).`
      );
    }

    // 4. Creación y Persistencia
    const solicitud = this.solicitudRepo.create({
      ...dto,
      fechaInicio: inicioNuevo,
      fechaFin: finNuevo,
      usuarioId: usuarioCompleto.id,
      empresaId: usuarioCompleto.empresaId,
      usuario: usuarioCompleto,
      estado: RequestStatus.PENDIENTE,
      nombre: usuarioCompleto.nombre,
      apellidos: usuarioCompleto.apellidos,
    } as DeepPartial<SolicitudEntity>);


    return await this.solicitudRepo.save(solicitud);
  }

  /**
     * Revisa una solicitud existente, actualizando su estado y creando una ausencia si es aprobada.
     * * @param id ID de la solicitud a revisar. 
     * @param dto  Datos necesarios para la revisión de la solicitud.
     * @param admin  Usuario administrador que realiza la revisión.
     * @returns  Información sobre el resultado de la revisión.
     * @throws NotFoundException si la solicitud no existe.
     * @throws BadRequestException si la solicitud ya fue procesada o si ocurre un error durante la transacción.
     */
  async revisar(id: number, dto: RevisarRequestDto, admin: User) {
    // 1. Buscar la solicitud cargando relaciones necesarias (usuario y empresa)
    const solicitud = await this.solicitudRepo.findOne({
      where: { id },
      relations: ['usuario', 'empresa'],
    });

    if (!solicitud) {
      throw new NotFoundException(`No se encontró la solicitud con ID ${id}`);
    }

    // 🛡️ Seguridad: Multi-empresa y Conflicto de Intereses
    if (solicitud.empresaId !== admin.empresaId) {
      throw new ForbiddenException('No tienes permiso para revisar solicitudes de otra empresa.');
    }
    if (solicitud.usuarioId === admin.id) {
      throw new ForbiddenException('No puedes revisar tu propia solicitud.');
    }

    // 2. Validar que no haya sido procesada
    const revisionExistente = await this.dataSource.getRepository(RevisionRequest).findOne({ where: { solicitudId: id } });
    if (revisionExistente || solicitud.estado !== RequestStatus.PENDIENTE) {
      throw new BadRequestException(`Esta solicitud ya fue procesada anteriormente.`);
    }

    // 3. Iniciar Transacción
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // ---------------------------------------------------------
      // PASO A: Actualizar Estado de la Solicitud
      // ---------------------------------------------------------
      solicitud.estado = dto.estado;
      await queryRunner.manager.save(solicitud);

      // ---------------------------------------------------------
      // PASO B: Crear Registro de Revisión (Audit Log)
      // ---------------------------------------------------------
      const nuevaRevision = queryRunner.manager.create(RevisionRequest, {
        solicitudId: solicitud.id,
        adminId: admin.id,
        estadoResultante: dto.estado,
        comentarioAdmin: dto.comentarioAdmin,
      });
      await queryRunner.manager.save(nuevaRevision);

      // ---------------------------------------------------------
      // PASO C: Generar Ausencia (Solo si fue APROBADA)
      // ---------------------------------------------------------
     if (dto.estado === RequestStatus.APROBADA) {
  const nuevaAusencia = new Ausencia();

  // 1. Evitamos el NULL en 'tipo' normalizando el valor
  const tipoLimpio = solicitud.tipo ? solicitud.tipo.toUpperCase() : 'VACACIONES';
  nuevaAusencia.tipo = tipoLimpio as any;

  // 2. Asignamos SOLO los IDs (ya que tu entidad no tiene las propiedades de relación 'usuario' y 'empresa')
  nuevaAusencia.usuarioId = solicitud.usuarioId;
  nuevaAusencia.empresaId = solicitud.empresaId;

  // 3. Fechas (Formato YYYY-MM-DD)
  const fechaInicio = new Date(solicitud.fechaInicio);
  const fechaFin = new Date(solicitud.fechaFin);
  nuevaAusencia.fechaInicio = fechaInicio.toISOString().split('T')[0];
  nuevaAusencia.fechaFin = fechaFin.toISOString().split('T')[0];

  // 4. Otros campos
  nuevaAusencia.motivo = `Solicitud aprobada: ${solicitud.motivo || 'Sin descripción'}`;
  nuevaAusencia.estado = AusenciaEstado.APROBADA;

  // 5. Cálculo de días
  const diffTime = fechaFin.getTime() - fechaInicio.getTime();
  nuevaAusencia.diasTotales = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  nuevaAusencia.diasConsumidos = 0;

  await queryRunner.manager.save(nuevaAusencia);
}

      // ---------------------------------------------------------
      // 🚩 PASO D: ARCHIVADO INMEDIATO (Soft Delete)
      // Esto hace que desaparezca de la bandeja pero se mantenga en historial
      // ---------------------------------------------------------
      await queryRunner.manager.softRemove(solicitud);

      // 4. Confirmar Cambios
      await queryRunner.commitTransaction();

      return {
        ok: true,
        message: `Solicitud ${dto.estado.toLowerCase()} y archivada correctamente`,
        solicitudId: solicitud.id,
        ausenciaGenerada: dto.estado === RequestStatus.APROBADA
      };

    } catch (error) {
      // Si algo falla, deshacemos TODO
      await queryRunner.rollbackTransaction();
      console.error('Error en transacción de revisión:', error);
      throw new BadRequestException(`No se pudo procesar la revisión: ${error.message}`);
    } finally {
      // Liberamos el queryRunner
      await queryRunner.release();
    }
  }
  /**
   *  Lista todas las solicitudes asociadas a una empresa, con opción de filtrar por usuario.
   *  
   * @param empresaId ID de la empresa cuyas solicitudes se desean listar.
   * @param usuarioId (Opcional) ID del usuario para filtrar las solicitudes.
   * @returns Lista de solicitudes que coinciden con los criterios.
   * @see Request
   * 
   */


  async findAllByEmpresa(empresaId: number, usuarioId?: number) { // Listar solicitudes por empresa y opcionalmente por usuario
    const whereCondition: any = { empresaId }; // Condición base por empresa
    if (usuarioId) whereCondition.usuarioId = usuarioId; // Agregar filtro por usuario si se proporciona

    return await this.solicitudRepo.find({ // Buscar con condiciones dinámicas
      where: whereCondition, // Condición dinámica
      relations: ['usuario', 'revision'],  // Cargar relaciones necesarias
      order: { createdAt: 'DESC' }  // Ordenar por fecha de creación descendente
    });
  }

  // No olvides importar estos de @nestjs/common y typeorm
  // import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

  async update(id: number, dto: any, user: any) {
    // 1. Verificar existencia
    const solicitud = await this.solicitudRepo.findOne({
      where: { id },
      relations: ['usuario']
    });

    if (!solicitud) {
      throw new NotFoundException(`La solicitud #${id} no existe.`);
    }

    // 2. Seguridad: El Worker solo puede editar lo suyo
    // Comprobamos contra user.id (del JWT) y solicitud.usuarioId (de la DB)
    if (solicitud.usuarioId !== user.id) {
      throw new ForbiddenException('No tienes permiso para editar esta solicitud.');
    }

    // 3. Regla de Oro del TFG: Bloquear edición si no está PENDIENTE
    if (solicitud.estado !== 'PENDIENTE') {
      throw new BadRequestException(
        `Estado actual: ${solicitud.estado}. No se puede editar una solicitud ya procesada.`
      );
    }

    // 4. Mapeo manual o con Object.assign para actualizar campos
    // Solo permitimos editar ciertos campos para evitar que cambien el 'estado' o 'usuarioId'
    if (dto.fechaInicio) solicitud.fechaInicio = new Date(dto.fechaInicio);
    if (dto.fechaFin) solicitud.fechaFin = new Date(dto.fechaFin);
    if (dto.motivo) solicitud.motivo = dto.motivo;
    if (dto.tipo) solicitud.tipo = dto.tipo;

    return await this.solicitudRepo.save(solicitud);
  }

  async findOne(id: number, user: UserPayload) {
    // 1. Buscamos la solicitud con sus relaciones
    const solicitud = await this.solicitudRepo.findOne({
      where: { id },
      relations: ['usuario', 'revision']
    });

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con ID ${id} no encontrada`);
    }

    // 2. Lógica de permisos para WORKER
    // Un trabajador solo puede ver su propia solicitud
    if (user.rol === UserRole.WORKER && solicitud.usuarioId !== user.id) {
      throw new ForbiddenException('No tienes permiso para ver solicitudes de otros trabajadores');
    }

    // 3. Lógica de permisos para ADMIN
    // Un administrador solo puede ver solicitudes de su propia empresa
    if (user.rol === UserRole.ADMIN && solicitud.empresaId !== user.empresaId) {
      throw new ForbiddenException('Esta solicitud pertenece a otra empresa');
    }

    return solicitud;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCleanup() {
    console.log('⏰ [CRON SOLICITUDES] ¡Despertando!');
    const empresas = await this.companyRepo.find();
    const defaultDays = +this.configService.get('DEFAULT_DAYS_REQUESTS') || 15;

    for (const empresa of empresas) {
      // CAMBIA || POR ??
      const dias = empresa.daysArchiveRequests ?? defaultDays;
      await this.cleanOldRecords(dias, [RequestStatus.APROBADA, RequestStatus.RECHAZADA], empresa.id);
    }
  }


  async findHistorial(empresaId: number, estado?: string) {
    //  Condición base: Siempre filtramos por la empresa
    const whereCondition: any = {
      empresaId: Number(empresaId)
    };

    //  Lógica para OCULTAR PENDIENTES
    if (estado === 'APROBADA') {
      whereCondition.estado = RequestStatus.APROBADA;
    } else if (estado === 'RECHAZADA') {
      whereCondition.estado = RequestStatus.RECHAZADA;
    } else {
      whereCondition.estado = In([RequestStatus.APROBADA, RequestStatus.RECHAZADA]);
    }

    // Ejecución de la búsqueda
    return await this.solicitudRepo.find({
      where: whereCondition,
      withDeleted: true, // Incluye las archivadas por el Cron
      relations: ['usuario', 'revision'],
      order: { updatedAt: 'DESC' } // Lo más reciente arriba
    });
  } s
}