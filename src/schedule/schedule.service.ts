import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository,  DataSource } from 'typeorm'; 
import { Horario } from './entities/schedules.entity';
import { CreateHorarioDto } from './dto/create-schedule.dto';
import type { UserPayload } from '../auth/interfaces/user-payload.interface'; 
import {  DistribucionDia } from './entities/distribucion-dia.entity';
import { FranjaHoraria } from 'timeSlot/entities/franja-horaria.entity';


@Injectable()
export class ScheduleService {
  constructor(
      @InjectRepository(Horario)
  private readonly horarioRepository: Repository<Horario>, // Repositorio para Horario
  private readonly dataSource: DataSource,  // Inyectamos DataSource para manejar transacciones
  
  ) {}



async create(dto: CreateHorarioDto, user: UserPayload) {
  if (!user.empresaId) throw new BadRequestException('Usuario sin empresa');

  const queryRunner = this.dataSource.createQueryRunner(); // Creamos un QueryRunner para manejar la transacción manualmente
  await queryRunner.connect(); // Conectamos el QueryRunner a la base de datos
  await queryRunner.startTransaction(); // Iniciamos la transacción

  try {
    // ---------------------------------------------------------
    // PASO 1: GUARDAR EL PADRE (HORARIO)
    // ---------------------------------------------------------
    const nuevoHorario = queryRunner.manager.create(Horario, {
      nombre: dto.nombre,
      tipo: dto.tipo,
      fechaInicio: new Date(dto.fechaInicio),
      fechaFin: new Date(dto.fechaFin),
      isActive: true,
      empresa: { id: user.empresaId } as any, // Relación padre
    });

    const horarioGuardado = await queryRunner.manager.save(nuevoHorario);
    console.log('Horario creado con ID:', horarioGuardado.id);

    // ---------------------------------------------------------
    // PASO 2: GUARDAR LOS HIJOS (DISTRIBUCIONES)
    // ---------------------------------------------------------
    if (dto.distribuciones && dto.distribuciones.length > 0) {
      for (const distDto of dto.distribuciones) {
        const nuevaDist = queryRunner.manager.create(DistribucionDia, {
          diaSemana: distDto.diaSemana as any,
          horasDia: distDto.horasDia,
          horario: horarioGuardado, //  FK asignada automáticamente
        });

        const distGuardada = await queryRunner.manager.save(nuevaDist);

        // ---------------------------------------------------------
        // PASO 3: GUARDAR LOS NIETOS (FRANJAS)
        // ---------------------------------------------------------
        if (distDto.franjas && distDto.franjas.length > 0) {
          const franjasInstances = distDto.franjas.map(fDto =>
            queryRunner.manager.create(FranjaHoraria, {
              inicio: fDto.inicio,
              fin: fDto.fin,
              distribucionDia: distGuardada,   // relación padre
              distribucionDiaId: distGuardada.id, // FK explícita
            })
          );

          await queryRunner.manager.save(franjasInstances);
        }
      }
    }

    // ---------------------------------------------------------
    // CONFIRMAMOS LA TRANSACCIÓN
    // ---------------------------------------------------------
    await queryRunner.commitTransaction();

    // ---------------------------------------------------------
    // RETORNO FINAL: usamos QueryBuilder para ordenar correctamente
    // ---------------------------------------------------------
    // ---------------------------------------------------------
    const horarioCompleto = await queryRunner.manager
      .createQueryBuilder(Horario, 'horario')
      .leftJoinAndSelect('horario.distribuciones', 'distribucion')
      .leftJoinAndSelect('distribucion.franjas', 'franja')
      .where('horario.id = :id', { id: horarioGuardado.id })
      .orderBy('distribucion.id', 'ASC')
      .addOrderBy('franja.id', 'ASC')
      .getOne();

    return horarioCompleto;

  } catch (err) {
    console.error('Error en transacción:', err);
    await queryRunner.rollbackTransaction();
    throw new BadRequestException(`No se pudo crear el horario: ${err.message}`);
  } finally {
    await queryRunner.release();
  }
}

/**
 * Busca todos los horarios activos de una empresa, incluyendo sus distribuciones y franjas, ordenados por fecha de creación descendente.
 * @param empresaId - ID de la empresa para filtrar los horarios
 * @returns Lista de horarios con sus distribuciones y franjas
 * @throws NotFoundException si no se encuentran horarios para la empresa
 * @throws InternalServerErrorException si ocurre un error al acceder a la base de datos  
 */
  async findAllByEmpresa(empresaId: number) {
    return await this.horarioRepository.find({
      where: { empresa: { id: empresaId }, isActive: true },
      relations: ['distribuciones', 'distribuciones.franjas'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * 
   * Busca un horario por su ID asegurando que pertenezca a la empresa del usuario.
   * Si no se encuentra o no pertenece, lanza NotFoundException.
   * Si el usuario no tiene empresa asignada, lanza UnauthorizedException.
   * @returns El horario encontrado con sus distribuciones y franjas
   * 
   * 
   */
  async findOne(id: number, empresaId: number) {
    const horario = await this.horarioRepository.findOne({
      where: { id, empresa: { id: empresaId } },
      relations: ['distribuciones', 'distribuciones.franjas']
    });

    if (!horario) throw new NotFoundException(`Horario no encontrado o no tienes acceso`);
    return horario;
  }

  /**
   * 
   * @param id - ID del horario a eliminar  
   * @param empresaId - ID de la empresa para validar propiedad  
   * @returns Mensaje de éxito al eliminar el horario 
   * @throws NotFoundException si el horario no existe o no pertenece a la empresa
   * @throws InternalServerErrorException si ocurre un error al eliminar el horario
   * 
   */
  async remove(id: number, empresaId: number) {
    await this.findOne(id, empresaId);
    const result = await this.horarioRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('No se pudo eliminar el horario');
    return { message: 'Horario eliminado correctamente' };
  }
}