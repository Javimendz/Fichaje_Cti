import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";

import { Solicitud, SolicitudStatus } from "./entities/solicitud.entity";
import { RevisionSolicitud } from "./entities/revision-solicitud.entity";
import { Ausencia, AusenciaEstado } from "../ausencia/entities/ausencia.entity"; // Verifica esta ruta
import { User } from "../auth/entities/user.entity";
import { CreateSolicitudDto } from "./dto/create-solicitud.dto";
import { RevisarSolicitudDto } from "./dto/revisar-solicitud.dto";

@Injectable()
export class SolicitudesService {
  constructor(
    @InjectRepository(Solicitud) 
    private readonly solicitudRepo: Repository<Solicitud>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateSolicitudDto, user: User) {
    if (!user.empresaId) {
      throw new BadRequestException('El usuario no tiene una empresa asignada.');
    }
    
    const solicitud = this.solicitudRepo.create({
      ...dto,
      usuarioId: user.id,
      empresaId: user.empresaId,
      // Asegúrate de que tu DTO use fechaInicio/fechaFin o mapealos aquí
    });
    
    return await this.solicitudRepo.save(solicitud);
  }

 async revisar(id: string, dto: RevisarSolicitudDto, admin: User) {
  // 1. Buscar la solicitud con su revisión para validar
  const solicitud = await this.solicitudRepo.findOne({
    where: { id },
    relations: ['revision'], // Cargamos la relación para verificar si ya existe
  });

  if (!solicitud) {
    throw new NotFoundException(`No se encontró la solicitud con ID ${id}`);
  }

  // 2. VALIDACIÓN: Evitar el error de "duplicate key" (Unique constraint)
  // Si ya tiene una revisión o el estado no es PENDIENTE, lanzamos error amigable
  if (solicitud.revision || solicitud.estado !== SolicitudStatus.PENDIENTE) {
    throw new BadRequestException(
      `Esta solicitud ya fue procesada anteriormente. Estado actual: ${solicitud.estado}`
    );
  }

  // 3. Iniciar Transacción
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 4. Actualizar el estado de la Solicitud
    solicitud.estado = dto.estado;
    await queryRunner.manager.save(solicitud);

    // 5. Crear el registro de la Revisión (evitando el error de revisado_por_id)
    const nuevaRevision = queryRunner.manager.create(RevisionSolicitud, {
      solicitudId: solicitud.id,
      adminId: admin.id, // Mapeado a 'revisado_por_id' en la entidad
      estadoResultante: dto.estado,
      comentarios: dto.comentarioAdmin,
    });
    await queryRunner.manager.save(nuevaRevision);

    // 6. SI ESTÁ APROBADA: Crear la Ausencia automáticamente
    if (dto.estado === SolicitudStatus.APROBADA) {
      // Cálculo de días para la tabla de ausencias
      const inicio = new Date(solicitud.fechaInicio);
      const fin = new Date(solicitud.fechaFin);
      const diffTime = Math.abs(fin.getTime() - inicio.getTime());
      const diasTotales = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const nuevaAusencia = queryRunner.manager.create(Ausencia, {
        tipo: solicitud.tipo,
        fechaInicio: solicitud.fechaInicio, 
        fechaFin: solicitud.fechaFin,   
        usuarioId: solicitud.usuarioId,
        empresaId: solicitud.empresaId,
        motivo: `Aprobado por ${admin.nombre}: ${solicitud.motivo || 'Sin descripción'}`,
        estado: AusenciaEstado.APROBADA,
        diasTotales: diasTotales,
        diasConsumidos: 0
      });

      await queryRunner.manager.save(nuevaAusencia);
    }

    // 7. Confirmar cambios
    await queryRunner.commitTransaction();

    return {
      ok: true,
      message: `Solicitud ${dto.estado.toLowerCase()} correctamente`,
      solicitudId: solicitud.id,
      ausenciaGenerada: dto.estado === SolicitudStatus.APROBADA
    };

  } catch (error) {
    // Si algo falla, deshacemos todo
    await queryRunner.rollbackTransaction();
    console.error('Error en transacción de revisión:', error);
    
    // Si el error es de base de datos pero se escapó de la validación inicial
    if (error.code === '23505') {
       throw new BadRequestException('Esta solicitud ya cuenta con una revisión registrada.');
    }
    
    throw new BadRequestException('No se pudo procesar la revisión de la solicitud');
  } finally {
    // Liberar la conexión
    await queryRunner.release();
  }
}

  async findAllByEmpresa(empresaId: string, usuarioId?: string) {
    const whereCondition: any = { empresaId };
    if (usuarioId) whereCondition.usuarioId = usuarioId;

    return await this.solicitudRepo.find({
      where: whereCondition,
      relations: ['usuario', 'revision'], 
      order: { createdAt: 'DESC' } 
    });
  }
}