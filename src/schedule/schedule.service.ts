import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository,  DataSource, MoreThanOrEqual } from 'typeorm'; 
import { Horario } from './entities/schedules.entity';
import { CreateHorarioDto } from './dto/create-schedule.dto';
import type { UserPayload } from '../auth/interfaces/user-payload.interface'; 
import { FranjaHoraria } from 'timeSlot/entities/franja-horaria.entity';
import { User } from 'auth/entities/user.entity';
import { Workday } from 'workday/entities/workday.entity';
import { DistribucionDia } from './entities/distribucion-dia.entity';

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
   * Crea un nuevo horario con sus distribuciones y franjas horarias asociadas.
   * Utiliza el gestor de transacciones automático de TypeORM para asegurar la integridad de los datos sin errores de QueryRunner.
   * @param dto - Datos para crear el horario, incluyendo distribuciones y franjas
   * @param user - Información del usuario que realiza la acción
   */
  async create(dto: CreateHorarioDto, user: UserPayload) {
    if (!user.empresaId) throw new BadRequestException('Usuario sin empresa');

    try {
      // 🔥 MAGIA AQUÍ: Usamos el transactionManager automático. Si algo falla, él solo hace Rollback.
      return await this.dataSource.transaction(async (transactionManager) => {
        
        // ---------------------------------------------------------
        // PASO 1: GUARDAR EL PADRE (HORARIO)
        // ---------------------------------------------------------
        const nuevoHorario = transactionManager.create(Horario, {
          nombre: dto.nombre,
          tipo: dto.tipo,
          esRotativo: dto.esRotativo ?? false,           // 👈 Lógica de rotación
          semanasRotacion: dto.semanasRotacion ?? 1,     // 👈 Lógica de rotación
          isActive: true,
          empresa: { id: user.empresaId } as any, 
        });

        const horarioGuardado = await transactionManager.save(nuevoHorario);
        console.log('✅ Horario creado con ID:', horarioGuardado.id);

        // ---------------------------------------------------------
        // PASO 2: GUARDAR LOS HIJOS (DISTRIBUCIONES)
        // ---------------------------------------------------------
        if (dto.distribuciones && dto.distribuciones.length > 0) {
          for (const distDto of dto.distribuciones) {
            const nuevaDist = transactionManager.create(DistribucionDia, {
              diaSemana: distDto.diaSemana as any,
              horasDia: distDto.horasDia,
              semanaRotacion: distDto.semanaRotacion ?? 1, // 👈 Semana del ciclo
              horario: horarioGuardado, 
            });

            const distGuardada = await transactionManager.save(nuevaDist);

            // ---------------------------------------------------------
            // PASO 3: GUARDAR LOS NIETOS (FRANJAS)
            // ---------------------------------------------------------
            if (distDto.franjas && distDto.franjas.length > 0) {
              const franjasInstances = distDto.franjas.map(fDto =>
                transactionManager.create(FranjaHoraria, {
                  inicio: fDto.inicio,
                  fin: fDto.fin,
                  distribucionDia: distGuardada,
                  distribucionDiaId: distGuardada.id,
                })
              );

              await transactionManager.save(franjasInstances);
            }
          }
        }

        // ---------------------------------------------------------
        // PASO 4: RETORNO FINAL ORDENADO (Usando el transactionManager)
        // ---------------------------------------------------------
        const horarioCompleto = await transactionManager
          .createQueryBuilder(Horario, 'horario')
          .leftJoinAndSelect('horario.distribuciones', 'distribucion')
          .leftJoinAndSelect('distribucion.franjas', 'franja')
          .where('horario.id = :id', { id: horarioGuardado.id })
          .orderBy('distribucion.semanaRotacion', 'ASC') // Primero ordenamos por semana de rotación
          .addOrderBy('distribucion.id', 'ASC')          // Luego por ID del día
          .addOrderBy('franja.id', 'ASC')                // Finalmente por ID de la franja
          .getOne();

        return horarioCompleto;
      }); // <-- FIN DE LA TRANSACCIÓN AUTOMÁTICA

    } catch (err) {
      // Si la base de datos se queja de algo (ej. falta una columna), caerá aquí directamente y lo veremos claro.
      console.error('🔥 ERROR REAL EN BASE DE DATOS:', err);
      throw new BadRequestException(`No se pudo crear el horario: ${err.message}`);
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

  // VALIDACIÓN PREVIA DE REGLAS DE NEGOCIO
  if (dto.distribuciones) {
    for (const dist of dto.distribuciones) {
      this.validarJornadaCompleta(dist);
    }
  }

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
    if (dto.esRotativo !== undefined) horarioExistente.esRotativo = dto.esRotativo;
    if (dto.semanasRotacion !== undefined) horarioExistente.semanasRotacion = dto.semanasRotacion;

    await queryRunner.manager.save(horarioExistente);

    // 3. Reemplazo de distribuciones y franjas (Solo si se envían en el DTO)
    if (dto.distribuciones) {
      
      // A. Borrado manual de hijos y nietos antiguos
      for (const dist of horarioExistente.distribuciones) {
        // 🔥 Usamos la relación en lugar de la columna física para borrar
        await queryRunner.manager.delete(FranjaHoraria, { distribucionDia: { id: dist.id } });
        // Borramos la distribución (hijo)
        await queryRunner.manager.delete(DistribucionDia, { id: dist.id });
      }

      // B. Creación de las nuevas distribuciones y franjas
      for (const distDto of dto.distribuciones) {
        const nuevaDist = queryRunner.manager.create(DistribucionDia, {
          diaSemana: distDto.diaSemana as any,
          horasDia: distDto.horasDia,
          semanaRotacion: distDto.semanaRotacion ?? 1, // Semana a la que pertenece
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
    return await this.findOne(id, user.empresaId); 

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


  /**
 * Valida que la suma de las franjas horarias sea igual o mayor a las horasDia definidas.
 * Esto permite el horario partido con descanso libre, siempre que se cumpla la jornada.
 */
private validarJornadaCompleta(distDto: any) {
  if (!distDto.franjas || distDto.franjas.length === 0) return;

  let minutosTotalesFranjas = 0;
  
  // Convertimos franjas a minutos y las ordenamos por inicio
  const franjasEnMinutos = distDto.franjas.map(f => {
    const [hIni, mIni] = f.inicio.split(':').map(Number);
    const [hFin, mFin] = f.fin.split(':').map(Number);
    return {
      inicio: hIni * 60 + mIni,
      fin: hFin * 60 + mFin,
      texto: `${f.inicio}-${f.fin}`
    };
  }).sort((a, b) => a.inicio - b.inicio);

  // Validar cada franja y detectar solapamientos
  for (let i = 0; i < franjasEnMinutos.length; i++) {
    const actual = franjasEnMinutos[i];

    if (actual.fin <= actual.inicio) {
      throw new BadRequestException(`La franja ${actual.texto} es inválida.`);
    }

    // 🔥 DETECCIÓN DE SOLAPAMIENTO: 
    // Si no es la última franja, revisamos si choca con la siguiente
    if (i < franjasEnMinutos.length - 1) {
      const siguiente = franjasEnMinutos[i + 1];
      if (actual.fin > siguiente.inicio) {
        throw new BadRequestException(
          `Solapamiento detectado en el día ${distDto.diaSemana}: La franja ${actual.texto} choca con la franja ${siguiente.texto}.`
        );
      }
    }

    minutosTotalesFranjas += (actual.fin - actual.inicio);
  }

  const minutosObjetivo = distDto.horasDia * 60;

  if (minutosTotalesFranjas < minutosObjetivo) {
    throw new BadRequestException(
      `En el día ${distDto.diaSemana}, las franjas suman ${minutosTotalesFranjas / 60}h, pero el mínimo diario es ${distDto.horasDia}h.`
    );
  }

}



  /**
   * ⏱️ SIMULADOR DE ROTACIÓN (Fórmula Matemática)
   * Calcula en qué semana del ciclo nos encontramos basándose en una fecha de inicio y la fecha actual/objetivo.
   * @param fechaInicioCiclo - La fecha exacta en la que el trabajador empezó este horario (Ej: un lunes).
   * @param fechaObjetivo - La fecha que queremos consultar (Ej: el día de hoy).
   * @param totalSemanasRotacion - El número total de semanas que tiene el ciclo (Ej: 2 para rotación mañana/tarde).
   * @returns El número de la semana actual (1, 2, 3...) dentro de la rotación.
   */
  calcularSemanaRotacion(fechaInicioCiclo: Date, fechaObjetivo: Date, totalSemanasRotacion: number): number {
    // 1. Calculamos cuántos milisegundos tiene una semana exacta (7 días)
    const msPorSemana = 1000 * 60 * 60 * 24 * 7;
    
    // 2. Calculamos la diferencia total en milisegundos entre hoy y el día que empezó
    const diferenciaMs = fechaObjetivo.getTime() - fechaInicioCiclo.getTime();
    
    // 3. Convertimos esa diferencia a semanas enteras pasadas.
    // Math.floor redondea hacia abajo (ej. si llevas 1.5 semanas, has completado 1 semana entera).
    // Math.max(0, ...) evita que salgan números negativos si envían una fecha anterior al inicio.
    const semanasPasadas = Math.max(0, Math.floor(diferenciaMs / msPorSemana));

    // 4. La magia del operador módulo (%): divide y se queda con el resto.
    // Si han pasado 3 semanas y el ciclo es de 2 semanas: 3 % 2 = 1.
    // Le sumamos + 1 porque en nuestra base de datos las semanas empiezan en 1 (Semana 1, Semana 2), no en 0.
    const semanaActual = (semanasPasadas % totalSemanasRotacion) + 1;

    return semanaActual;
  

  }
}

