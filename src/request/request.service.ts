import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, LessThanOrEqual, MoreThanOrEqual, Not, Repository } from "typeorm";

import { Request } from "./entities/request.entity";
import { RevisionRequest } from "./entities/revision-request.entity";
import { Ausencia, AusenciaEstado } from "../absence/entities/ausencia.entity"; // Verifica esta ruta
import { User } from "../auth/entities/user.entity";
import { CreateRequestDto } from "./dto/create-request.dto";
import { RevisarRequestDto, RequestStatus } from "./dto/revisar-request.dto";


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
    @InjectRepository(Request)  // Inyección del repositorio de Solicitud
    private readonly solicitudRepo: Repository<Request>, // Repositorio para operaciones CRUD en Solicitud
    private readonly dataSource: DataSource, // Inyección
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
      // Comparamos el inicio de la guardada contra el fin de la nueva
      // y el fin de la guardada contra el inicio de la nueva
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
    fechaInicio: inicioNuevo, // Guardamos la fecha normalizada
    fechaFin: finNuevo,       // Guardamos la fecha normalizada
    usuario: user, 
    empresa: { id: user.empresaId }, 
    estado: RequestStatus.PENDIENTE, 
  });

  return await this.solicitudRepo.save(solicitud);
}

/**
 *  Revisa una solicitud existente, actualizando su estado y creando una ausencia si es aprobada.
 *   
 * @param id ID de la solicitud a revisar. 
 * @param dto  Datos necesarios para la revisión de la solicitud.
 * @param admin  Usuario administrador que realiza la revisión.
 * @returns  Información sobre el resultado de la revisión.
 * @throws NotFoundException si la solicitud no existe.
 * @throws BadRequestException si la solicitud ya fue procesada o si ocurre un error durante la transacción.
 */

 async revisar(id: number, dto: RevisarRequestDto, admin: User) {
    // 1. Buscar la solicitud cargando relaciones necesarias para la Ausencia futura
    // 🔥 MEJORA: Cargamos 'usuario' y 'empresa' aquí para usarlos luego en la creación de Ausencia
    const solicitud = await this.solicitudRepo.findOne({
      where: { id },
      relations: ['revision', 'usuario', 'empresa'], 
    });

    if (!solicitud) {
      throw new NotFoundException(`No se encontró la solicitud con ID ${id}`);
    }

    // 2. Validaciones de Estado
    if (solicitud.revision || solicitud.estado !== RequestStatus.PENDIENTE) {
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
      // Usamos el manager de la transacción para guardar
      await queryRunner.manager.save(solicitud);

      // ---------------------------------------------------------
      // PASO B: Crear Registro de Revisión (Audit Log)
      // ---------------------------------------------------------
      // 🔥 CORRECCIÓN: Pasamos los objetos completos (solicitud, admin)
      // TypeORM extraerá los IDs automáticamente y los pondrá en las columnas FK.
      const nuevaRevision = queryRunner.manager.create(RevisionRequest, {
        solicitud: solicitud, // Pasamos el objeto, no el ID
        admin: admin,         // Pasamos el objeto admin completo
        estadoResultante: dto.estado, // Guardamos la decisión
        comentarioAdmin: dto.comentarioAdmin,
      });

      await queryRunner.manager.save(nuevaRevision);

      // ---------------------------------------------------------
      // PASO C: Generar Ausencia (Solo si fue APROBADA)
      // ---------------------------------------------------------
      if (dto.estado === RequestStatus.APROBADA) {
    const inicio = new Date(solicitud.fechaInicio);
    const fin = new Date(solicitud.fechaFin);
    
    // Normalización de fechas para el cálculo
    inicio.setHours(0, 0, 0, 0);
    fin.setHours(0, 0, 0, 0);
    
    const diffTime = Math.abs(fin.getTime() - inicio.getTime());
    const diasTotales = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // 🔥 LA CORRECCIÓN: Asegúrate de mapear empresaId correctamente
    const nuevaAusencia = queryRunner.manager.create(Ausencia, {
        tipo: solicitud.tipo,
        fechaInicio: solicitud.fechaInicio,
        fechaFin: solicitud.fechaFin,
        usuarioId: solicitud.usuarioId,
        // Usamos el ID que viene de la relación cargada o de la columna física
        empresaId: solicitud.empresaId, 
        motivo: `Aprobado por ${admin.nombre}: ${solicitud.motivo || 'Sin descripción'}`,
        estado: AusenciaEstado.APROBADA,
        diasTotales: diasTotales,
        diasConsumidos: 0
    });

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
      
      if (error.code === '23505') { // Error unique constraint (por si acaso)
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