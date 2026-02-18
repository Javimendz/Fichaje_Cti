import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, DataSource } from 'typeorm'; // 👈 Importamos DataSource
import { Horario } from './entities/schedules.entity';
import { CreateHorarioDto } from './dto/create-schedule.dto';
import type { UserPayload } from '../auth/interfaces/user-payload.interface'; 
import { DiaSemana, DistribucionDia } from './entities/distribucion-dia.entity';
import { FranjaHoraria } from 'timeSlot/entities/franja-horaria.entity';


@Injectable()
export class ScheduleService {
  constructor(
      @InjectRepository(Horario)
  private readonly horarioRepository: Repository<Horario>,
private readonly dataSource: DataSource, // 👈 INYECCIÓN NECESARIA
  
  ) {}



async create(dto: CreateHorarioDto, user: UserPayload) {
  if (!user.empresaId) throw new BadRequestException('Usuario sin empresa');

  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

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
          horario: horarioGuardado, // 🔑 FK asignada automáticamente
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

  async findAllByEmpresa(empresaId: number) {
    return await this.horarioRepository.find({
      where: { empresa: { id: empresaId }, isActive: true },
      relations: ['distribuciones', 'distribuciones.franjas'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number, empresaId: number) {
    const horario = await this.horarioRepository.findOne({
      where: { id, empresa: { id: empresaId } },
      relations: ['distribuciones', 'distribuciones.franjas']
    });

    if (!horario) throw new NotFoundException(`Horario no encontrado o no tienes acceso`);
    return horario;
  }

  async remove(id: number, empresaId: number) {
    await this.findOne(id, empresaId);
    const result = await this.horarioRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('No se pudo eliminar el horario');
    return { message: 'Horario eliminado correctamente' };
  }
}