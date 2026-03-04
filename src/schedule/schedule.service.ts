import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository,  DataSource, MoreThanOrEqual } from 'typeorm'; 
import { Horario } from './entities/schedules.entity';
import { CreateHorarioDto } from './dto/create-schedule.dto';
import type { UserPayload } from '../auth/interfaces/user-payload.interface'; 
import {  DistribucionDia } from './entities/distribucion-dia.entity';
import { FranjaHoraria } from 'timeSlot/entities/franja-horaria.entity';
import { User } from 'auth/entities/user.entity';
import { Workday } from 'workday/entities/workday.entity';

@Injectable()
export class ScheduleService {
  constructor(
      @InjectRepository(Horario)
  private readonly horarioRepository: Repository<Horario>, // Repositorio para Horario
  private readonly dataSource: DataSource,  // Inyectamos DataSource para manejar transacciones
  @InjectRepository(User)
  private readonly userRepository: Repository<User>, // Repositorio para User
   @InjectRepository(FranjaHoraria) 
   private readonly franjaRepo: Repository<FranjaHoraria>
  
  ) {}


  /// ---------------------------------------------------------
  /// MÉTODOS PRINCIPAL: CREAR HORARIO CON DISTRIBUCIONES Y FRANJAS
  /// --------------------------------------------------------- 

/**
 *  Crea un nuevo horario con sus distribuciones y franjas horarias asociadas en una transacción atómica.
 *  Si ocurre algún error durante el proceso, se revierte toda la transacción para mantener la integridad de los datos.
 * @param dto - Datos para crear el horario, incluyendo distribuciones y franjas
 * @param user - Información del usuario que realiza la acción, se utiliza para asignar la empresa al horario
 * @returns El horario completo creado, incluyendo sus distribuciones y franjas, ordenados correctamente
 * @throws BadRequestException si el usuario no tiene empresa asignada o si ocurre un error durante la creación
 *  
 */
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
      fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : null,
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

// ---------------------------------------------------------
/// MÉTODOS SECUNDARIOS: OBTENER Y ELIMINAR HORARIOS
// ---------------------------------------------------------    
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
  // ---------------------------------------------------------
  // MÉTODO SECUNDARIO: OBTENER UN HORARIO POR ID CON VALIDACIÓN DE EMPRESA
  // ---------------------------------------------------------
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
  // ---------------------------------------------------------
  // MÉTODO SECUNDARIO: ELIMINAR UN HORARIO CON VALIDACIÓN DE EMPRESA
  // ---------------------------------------------------------  
async remove(id: number, empresaId: number) {
  // 1. Desvincular usuarios: Ponemos a NULL el horarioId de quienes tengan este ID
  // Usamos el objeto de condiciones de forma explícita
  await this.userRepository.update(
    { horario: { id: id } }, // Buscamos por la relación
    { horario: null }         // Seteamos la relación a null
  );

  // 2. Ahora que nadie lo usa, borramos el horario
  const result = await this.horarioRepository.delete({ id, empresaId });
  
  if (result.affected === 0) {
    throw new NotFoundException(`No se encontró el horario con ID ${id}`);
  }

  return { mensaje: 'Horario eliminado y usuarios desvinculados.' };
}

// ---------------------------------------------------------
  // MÉTODO SECUNDARIO: ACTUALIZAR HORARIO Y SUS FRANJAS
  // ---------------------------------------------------------
  async update(id: number, dto: Partial<CreateHorarioDto>, user: UserPayload) {
    if (!user.empresaId) throw new BadRequestException('Usuario sin empresa');

    // 1. Verificamos que el horario existe y pertenece a la empresa
    const horarioExistente = await this.horarioRepository.findOne({
      where: { id, empresa: { id: user.empresaId } },
      relations: ['distribuciones', 'distribuciones.franjas'], // Cargamos las viejas
    });

    if (!horarioExistente) {
      throw new NotFoundException(`Horario con ID ${id} no encontrado en tu empresa`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 2. Actualizamos los campos básicos del Horario (Padre)
      if (dto.nombre) horarioExistente.nombre = dto.nombre;
      if (dto.tipo) horarioExistente.tipo = dto.tipo;
      if (dto.fechaInicio) horarioExistente.fechaInicio = new Date(dto.fechaInicio);
      if (dto.fechaFin !== undefined) horarioExistente.fechaFin = dto.fechaFin ? new Date(dto.fechaFin) : null;

      await queryRunner.manager.save(horarioExistente);

      // 3. Reemplazo de distribuciones y franjas (Solo si se envían en el DTO)
      if (dto.distribuciones) {
        
        // A. Borrado manual de hijos y nietos antiguos
        for (const dist of horarioExistente.distribuciones) {
          // 🔥 CORRECCIÓN 1: Usamos la relación en lugar de la columna física para borrar
          await queryRunner.manager.delete(FranjaHoraria, { distribucionDia: { id: dist.id } });
          // Borramos la distribución (hijo)
          await queryRunner.manager.delete(DistribucionDia, { id: dist.id });
        }

        // B. Creación de las nuevas distribuciones y franjas
        for (const distDto of dto.distribuciones) {
          const nuevaDist = queryRunner.manager.create(DistribucionDia, {
            diaSemana: distDto.diaSemana as any,
            horasDia: distDto.horasDia,
            horario: horarioExistente, 
          });

          const distGuardada = await queryRunner.manager.save(nuevaDist);

          if (distDto.franjas && distDto.franjas.length > 0) {
            const franjasInstances = distDto.franjas.map(fDto =>
              queryRunner.manager.create(FranjaHoraria, {
                inicio: fDto.inicio,
                fin: fDto.fin,
                distribucionDia: distGuardada, // 
              })
            );
            await queryRunner.manager.save(franjasInstances);
          }
        }
      }

      await queryRunner.commitTransaction();

      // 4. Retornamos el horario actualizado limpio
      return await this.findOne(id, user.empresaId); // Añadido el await por seguridad

    } catch (err) {
      console.error('Error al actualizar horario:', err);
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(`No se pudo actualizar el horario: ${err.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  // MÉTODO PRINCIPAL: OBTENER HORAS OBJETIVO SEMANAL
  // ---------------------------------------------------------
  //Calcular horas objetivo semanales 
  async getHorasObjetivoSemanal(userId: number){

    const user = await this.userRepository.findOne(
      {
        where: {
          id: userId,
        },
        relations: ['horario', 'horario.distribuciones'],

      }

    );

    if(!user || !user.horario) throw new NotFoundException('El usuario no tiene un horario asignado.');

    //Sumamos el campo horasDia de cada distribucion 
    const totalHoras = user.horario.distribuciones.reduce(
    (acc, dist) => acc + (Number(dist.horasDia) || 0), 
    0
  );

  return {

    userId, 
    horarioNombre: user.horario.nombre,
    totalHoras: totalHoras,

  };

  }


  //Calcular horas que lleva trabajado el worker reales

 async getHorasTrabajadasSemanales(userId: number) {
  const hoy = new Date();
  // Calculamos el lunes de esta semana a las 00:00:00
  const inicioSemana = new Date(hoy);
  inicioSemana.setDate(hoy.getDate() - (hoy.getDay() === 0 ? 6 : hoy.getDay() - 1));
  inicioSemana.setHours(0, 0, 0, 0);

  const registros = await this.dataSource.getRepository(Workday).find({
    where: {
      usuario: { id: userId }, // ✅ Usamos 'usuario' porque así se llama en tu entidad
      inicio: MoreThanOrEqual(inicioSemana), // ✅ Usamos 'inicio' porque no tienes columna 'fecha'
    },
  });

  // Calculamos el total sumando 'total_minutos' y convirtiendo a horas
  const totalMinutos = registros.reduce((acc, reg) => {
    return acc + (reg.total_minutos || 0);
  }, 0);

  const totalHoras = totalMinutos / 60;

  return {
    userId,
    totalHorasTrabajadas: parseFloat(totalHoras.toFixed(2)),
    totalMinutos,
    desde: inicioSemana.toISOString().split('T')[0]
  };
}

  //Calcular porcentaje de cumplimento de la jornada

  async getProgresoSemanal(userId: number){

      const {totalHoras } = await this.getHorasObjetivoSemanal(userId);
      const { totalHorasTrabajadas } = await this.getHorasTrabajadasSemanales(userId);

      if(totalHoras ===0) return { porcentaje:0, mensaje: 'El usuario no tiene horas objetivo asignadas para esta semana.'}

      const porcentaje = (totalHorasTrabajadas / totalHoras) * 100;

      return {

        userId,
        horasObjetivo: totalHoras,
        horasTrabajadas: totalHorasTrabajadas,
        porcentaje: parseFloat(porcentaje.toFixed(2)),
        completado: porcentaje >= 100

      }

  }

}