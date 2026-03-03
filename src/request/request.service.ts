import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, DeepPartial, LessThanOrEqual, MoreThanOrEqual, Not, Repository } from "typeorm";
import { Request as SolicitudEntity } from './entities/request.entity';

import { RevisionRequest } from "./entities/revision-request.entity";
import { User } from "../auth/entities/user.entity";
import { CreateRequestDto } from "./dto/create-request.dto";
import { RevisarRequestDto, RequestStatus } from "./dto/revisar-request.dto";
import { Ausencia } from "absence/entities/ausencia.entity";
import { AusenciaEstado } from "absence/dto/ausencia-estado.enum";


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
export class SolicitudesService { // Definición del servicio SolicitudesService
  constructor(
    @InjectRepository(SolicitudEntity)
private readonly solicitudRepo: Repository<SolicitudEntity>, // Repositorio para operaciones CRUD en Solicitud
    private readonly dataSource: DataSource, // Inyección
     @InjectRepository(User)                          // ✅ añadir
  private readonly userRepo: Repository<User>, 
  ) {}


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
async create(dto: CreateRequestDto, user: User) {
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
    // 1. Buscar la solicitud cargando relaciones necesarias
    const solicitud = await this.solicitudRepo.findOne({
      where: { id },
      relations: ['usuario', 'empresa'], 
    });

    if (!solicitud) {
      throw new NotFoundException(`No se encontró la solicitud con ID ${id}`);
    }

    // 🛡️ Seguridad Multi-empresa y Conflicto de Intereses
    if (solicitud.empresaId !== admin.empresaId) {
      throw new ForbiddenException('No tienes permiso para revisar solicitudes de otra empresa.');
    }
    if (solicitud.usuarioId === admin.id) {
      throw new ForbiddenException('No puedes revisar tu propia solicitud.');
    }

    // 2. Validaciones de Estado
    const revisionExistente = await this.dataSource.getRepository(RevisionRequest).findOne({ where: { solicitudId: id } });
    
    if (revisionExistente || solicitud.estado !== RequestStatus.PENDIENTE) {
      throw new BadRequestException(
        `Esta solicitud ya fue procesada anteriormente. Estado actual: ${solicitud.estado}`
      );
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
        const inicio = new Date(solicitud.fechaInicio);
        const fin = new Date(solicitud.fechaFin);
        
        // Normalización de fechas para el cálculo preciso de días
        inicio.setUTCHours(0, 0, 0, 0);
        fin.setUTCHours(0, 0, 0, 0);
        
        const diffTime = Math.abs(fin.getTime() - inicio.getTime());
        const diasTotales = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        // 🛠️ SOLUCIÓN: Instanciamos manualmente para evitar el error de DeepPartial
        // y aseguramos que las fechas entren a la base de datos como strings 'YYYY-MM-DD'.
        const nuevaAusencia = new Ausencia();
        nuevaAusencia.tipo = solicitud.tipo as any;
        nuevaAusencia.fechaInicio = inicio.toISOString().split('T')[0];
        nuevaAusencia.fechaFin = fin.toISOString().split('T')[0];
        nuevaAusencia.usuarioId = solicitud.usuarioId;
        nuevaAusencia.empresaId = solicitud.empresaId;
        nuevaAusencia.motivo = `Aprobado por ${admin.nombre}: ${solicitud.motivo || 'Sin descripción'}`;
        nuevaAusencia.estado = AusenciaEstado.APROBADA;
        nuevaAusencia.diasTotales = diasTotales;
        nuevaAusencia.diasConsumidos = 0;

        await queryRunner.manager.save(nuevaAusencia);
      }

      // 4. Confirmar Cambios
      await queryRunner.commitTransaction();

      return {
        ok: true,
        message: `Solicitud ${dto.estado.toLowerCase()} correctamente`,
        solicitudId: solicitud.id,
        ausenciaGenerada: dto.estado === RequestStatus.APROBADA
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error en transacción de revisión:', error);
      
      if (error.code === '23505') { 
         throw new BadRequestException('Esta solicitud ya tiene una revisión registrada.');
      }
      
      throw new BadRequestException(`No se pudo procesar la revisión: ${error.message}`);
    } finally {
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
}