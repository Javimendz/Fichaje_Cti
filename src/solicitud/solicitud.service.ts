import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, LessThanOrEqual, MoreThanOrEqual, Not, Repository } from "typeorm";

import { Solicitud, SolicitudStatus } from "./entities/solicitud.entity";
import { RevisionSolicitud } from "./entities/revision-solicitud.entity";
import { Ausencia, AusenciaEstado } from "../ausencia/entities/ausencia.entity"; // Verifica esta ruta
import { User } from "../auth/entities/user.entity";
import { CreateSolicitudDto } from "./dto/create-solicitud.dto";
import { RevisarSolicitudDto } from "./dto/revisar-solicitud.dto";


/**
 * SolicitudesService
 *  Servicio encargado de gestionar las operaciones relacionadas con las solicitudes de los usuarios.
 * Proporciona métodos para crear nuevas solicitudes, revisar solicitudes existentes
 * y listar solicitudes por empresa y usuario.
 * Métodos principales:
 * - create: Crea una nueva solicitud para un usuario.
 * - revisar: Permite a un administrador revisar una solicitud, actualizando su estado y creando una ausencia si es aprobada.
 * - findAllByEmpresa: Lista todas las solicitudes asociadas a una empresa, con opción de filtrar por usuario.
 * @see Solicitud para la entidad de solicitudes.
 * @see RevisionSolicitud para la entidad de revisiones de solicitudes.
 * @see Ausencia para la entidad de ausencias.
 * @see User para la entidad de usuarios.
 * @see CreateSolicitudDto para la estructura de datos al crear una solicitud.
 * @see RevisarSolicitudDto para la estructura de datos al revisar una solicitud.
 * @see https://docs.nestjs.com/providers
 * 
 */

@Injectable() // Marca la clase como un proveedor inyectable
export class SolicitudesService { // Definición del servicio SolicitudesService
  constructor(
    @InjectRepository(Solicitud)  // Inyección del repositorio de Solicitud
    private readonly solicitudRepo: Repository<Solicitud>, // Repositorio para operaciones CRUD en Solicitud
    private readonly dataSource: DataSource, // Inyección
  ) {}


  /**
   *  Crea una nueva solicitud asociada al usuario que la realiza.
   *  
   * @param dto Datos necesarios para crear la solicitud. 
   * @param user Usuario que realiza la solicitud. 
   * @return La solicitud creada.
   * @throws BadRequestException si el usuario no tiene una empresa asignada.
   * @see CreateSolicitudDto
   * @see Solicitud 
   */
 async create(dto: CreateSolicitudDto, user: User) {
  // 1. Validación de seguridad (Empresa)
  if (!user.empresaId) {
    throw new BadRequestException('El usuario no tiene una empresa asignada.');
  }

  // 2. Validación de Cronología (Inicio vs Fin)
  const inicio = new Date(dto.fechaInicio);
  const fin = new Date(dto.fechaFin);

  if (inicio > fin) {
    throw new BadRequestException('La fecha de fin no puede ser anterior a la fecha de inicio.');
  }

  // 3. Validación de Solapamiento (Overlap)
  // Evita que el usuario pida dos solicitudes que choquen en el calendario
  const solicitudExistente = await this.solicitudRepo.findOne({
  where: {
    usuarioId: user.id,
    // 2. Usa el valor del Enum en lugar del string "RECHAZADA"
    estado: SolicitudStatus.APROBADA, 
    fechaInicio: LessThanOrEqual(new Date(dto.fechaFin)),
    fechaFin: MoreThanOrEqual(new Date(dto.fechaInicio)),
  },
  });

  if (solicitudExistente) {
    throw new BadRequestException(
      `Ya tienes una solicitud para este periodo (${solicitudExistente.fechaInicio} al ${solicitudExistente.fechaFin})`
    );
  }

  // 4. Creación y Persistencia
  const solicitud = this.solicitudRepo.create({
  ...dto,
  usuario: user, 
  empresa: { id: user.empresaId }, 
  estado: SolicitudStatus.PENDIENTE, 
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

 async revisar(id: number, dto: RevisarSolicitudDto, admin: User) { // Revisión de una solicitud existente
  // 1. Buscar la solicitud con su revisión para validar
  const solicitud = await this.solicitudRepo.findOne({ // Buscar por ID
    where: { id }, // Condición de búsqueda
    relations: ['revision'], // Cargamos la relación para verificar si ya existe
  });

  if (!solicitud) { // Validación de existencia
    throw new NotFoundException(`No se encontró la solicitud con ID ${id}`); // Error si no existe
  }

  // 2. VALIDACIÓN: Evitar el error de clave única en la BD
  // Si ya tiene una revisión o el estado no es PENDIENTE, lanzamos error amigable
  if (solicitud.revision || solicitud.estado !== SolicitudStatus.PENDIENTE) {
    throw new BadRequestException(
      `Esta solicitud ya fue procesada anteriormente. Estado actual: ${solicitud.estado}`
    );
  }

  // 3. Iniciar Transacción
  const queryRunner = this.dataSource.createQueryRunner(); // Crear un query runner
  await queryRunner.connect(); // Conectar
  await queryRunner.startTransaction(); // Iniciar transacción

  try { // Bloque try-catch-finally para manejar la transacción
    // 4. Actualizar el estado de la Solicitud
    solicitud.estado = dto.estado; // Actualizar estado según DTO
    await queryRunner.manager.save(solicitud); // Guardar cambios en la transacción

    // 5. Crear el registro de la Revisión (evitando el error de revisado_por_id)
    const nuevaRevision = queryRunner.manager.create(RevisionSolicitud, { // Crear instancia de RevisionSolicitud
      solicitudId: solicitud.id, // Asociar a la solicitud
      adminId: admin.id, // Asociar al admin que revisa
      estadoResultante: dto.estado, 
      comentarioAdmin: dto.comentarioAdmin, // Comentarios opcionales
    });
    await queryRunner.manager.save(nuevaRevision); // Guardar la revisión en la transacción

    // 6. SI ESTÁ APROBADA: Crear la Ausencia automáticamente
    if (dto.estado === SolicitudStatus.APROBADA) { // Crear ausencia si es aprobada
      // Cálculo de días para la tabla de ausencias
      const inicio = new Date(solicitud.fechaInicio); // Fecha de inicio
      const fin = new Date(solicitud.fechaFin); // Fecha de fin
      inicio.setHours(0, 0, 0, 0);
      fin.setHours(0, 0, 0, 0);
      const diffTime = fin.getTime() - inicio.getTime();
    const diasTotales = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      // Crear la ausencia asociada

      const nuevaAusencia = queryRunner.manager.create(Ausencia, { // Crear instancia de Ausencia
        tipo: solicitud.tipo, // Tipo de ausencia según la solicitud
        fechaInicio: solicitud.fechaInicio,  // Fecha de inicio
        fechaFin: solicitud.fechaFin,    // Fecha de fin
        usuarioId: solicitud.usuarioId, // Asociar al usuario de la solicitud
        empresaId: solicitud.empresaId, // Asociar a la empresa de la solicitud
        motivo: `Aprobado por ${admin.nombre}: ${solicitud.motivo || 'Sin descripción'}`, // Motivo con referencia al admin
        estado: AusenciaEstado.APROBADA, // Estado aprobado
        diasTotales: diasTotales, // Días totales calculados
        diasConsumidos: 0 // Inicialmente 0
      });

      await queryRunner.manager.save(nuevaAusencia); // Guardar la ausencia en la transacción
    }

    // 7. Confirmar cambios
    await queryRunner.commitTransaction();

    return { // Respuesta exitosa
      ok: true, // Indicador de éxito
      message: `Solicitud ${dto.estado.toLowerCase()} correctamente`, // Mensaje dinámico
      solicitudId: solicitud.id, // ID de la solicitud revisada
      ausenciaGenerada: dto.estado === SolicitudStatus.APROBADA // Indicador si se generó ausencia
    };

  } catch (error) { // Manejo de errores
    // Si algo falla, deshacemos todo
    await queryRunner.rollbackTransaction(); // Revertir cambios
    console.error('Error en transacción de revisión:', error); // Log del error
    
    // Si el error es de base de datos pero se escapó de la validación inicial
    if (error.code === '23505') { // Código de error de clave única en PostgreSQL
       throw new BadRequestException('Esta solicitud ya cuenta con una revisión registrada.'); // Error amigable
    }
    
    throw new BadRequestException('No se pudo procesar la revisión de la solicitud'); // Error genérico
  } finally { 
    // Liberar la conexión
    await queryRunner.release();
  }
}

/**
 *  Lista todas las solicitudes asociadas a una empresa, con opción de filtrar por usuario.
 *  
 * @param empresaId ID de la empresa cuyas solicitudes se desean listar.
 * @param usuarioId (Opcional) ID del usuario para filtrar las solicitudes.
 * @returns Lista de solicitudes que coinciden con los criterios.
 * @see Solicitud
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