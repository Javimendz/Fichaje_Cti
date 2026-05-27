import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThanOrEqual, IsNull, Not, LessThanOrEqual } from 'typeorm'; 
import { Horario } from './entities/schedules.entity';
import { CreateHorarioDto } from './dto/create-schedule.dto';
import type { UserPayload } from '../auth/interfaces/user-payload.interface'; 
import { FranjaHoraria } from '../timeSlot/entities/franja-horaria.entity';
import { User } from '../auth/entities/user.entity';
import { Workday } from '../workday/entities/workday.entity';
import { DistribucionDia } from './entities/distribucion-dia.entity';
import { DateTime } from 'luxon';
import { Ausencia } from '../absence/entities/ausencia.entity';
import { AusenciaEstado } from '../absence/dto/ausencia-estado.enum';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);
  
  constructor(
    @InjectRepository(Horario) private readonly horarioRepository: Repository<Horario>,
    private readonly dataSource: DataSource,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(FranjaHoraria) private readonly franjaRepo: Repository<FranjaHoraria>,
    @InjectRepository(Ausencia) private readonly ausenciaRepository: Repository<Ausencia>,
    @InjectRepository(Worker) private readonly workerRepository: Repository<Worker>,
  ) {}

  // ---------------------------------------------------------
  // MÉTODOS CRUD PRINCIPALES
  // --------------------------------------------------------- 
  async create(dto: CreateHorarioDto, user: UserPayload) {
    if (!user.empresaId) throw new BadRequestException('Usuario sin empresa');

    try {
      return await this.dataSource.transaction(async (transactionManager) => {
        const nuevoHorario = transactionManager.create(Horario, {
          nombre: dto.nombre,
          tipo: dto.tipo,
          esRotativo: dto.esRotativo ?? false,
          semanasRotacion: dto.semanasRotacion ?? 1,
          isActive: true,
          empresa: { id: user.empresaId } as any, 
        });

        const horarioGuardado = await transactionManager.save(nuevoHorario);

        if (dto.distribuciones && dto.distribuciones.length > 0) {
          for (const distDto of dto.distribuciones) {
            this.validarJornadaCompleta(distDto); // Validación antes de guardar

            const nuevaDist = transactionManager.create(DistribucionDia, {
              diaSemana: distDto.diaSemana as any,
              horasDia: distDto.horasDia,
              semanaRotacion: distDto.semanaRotacion ?? 1,
              horario: horarioGuardado, 
            });

            const distGuardada = await transactionManager.save(nuevaDist);

            if (distDto.franjas && distDto.franjas.length > 0) {
              const franjasInstances = distDto.franjas.map(fDto =>
                transactionManager.create(FranjaHoraria, {
                  inicio: fDto.inicio,
                  fin: fDto.fin,
                  distribucionDia: distGuardada,
                })
              );
              await transactionManager.save(franjasInstances);
            }
          }
        }

        return await transactionManager
          .createQueryBuilder(Horario, 'horario')
          .leftJoinAndSelect('horario.distribuciones', 'distribucion')
          .leftJoinAndSelect('distribucion.franjas', 'franja')
          .where('horario.id = :id', { id: horarioGuardado.id })
          .orderBy('distribucion.semanaRotacion', 'ASC')
          .addOrderBy('distribucion.id', 'ASC')
          .addOrderBy('franja.id', 'ASC')
          .getOne();
      });
    } catch (err: any) {
      console.error('🔥 ERROR REAL EN BASE DE DATOS:', err);
      throw new BadRequestException(`No se pudo crear el horario: ${err.message}`);
    }
  }
async findAffectedWorkers(horarioId: number, empresaId: number): Promise<Worker[]> {
  return await this.workerRepository.find({
    where: {
      horarioId: horarioId
    } as any, // 🟢 El 'as any' silencia el error de propiedades conocidas
    select: ['id', 'nombre'] as any
  });
}
 async removeSeguro(id: number, empresaId: number) {
  // 1. Buscamos el horario apuntando al ID de la relación de la empresa (Multi-tenancy seguro)
  const horario = await this.horarioRepository.findOne({ 
    where: { 
      id, 
      empresa: { id: empresaId } 
    } 
  });
  
  if (!horario) {
    throw new NotFoundException(`El horario con ID ${id} no existe o no pertenece a tu empresa.`);
  }

  // 2. Contamos usando la columna física 'horarioId' con 'as any' para saltar el bloqueo de la interfaz
  const trabajadoresVinculados = await this.workerRepository.count({ 
    where: { 
      horarioId: id 
    } as any
  });

  // 3. Si hay trabajadores vinculados, frenamos el borrado inmediatamente
  if (trabajadoresVinculados > 0) {
    throw new BadRequestException({
      code: 'SCHEDULE_IN_USE',
      message: `No se puede eliminar el horario. Está asignado a ${trabajadoresVinculados} trabajadores activos.`,
      count: trabajadoresVinculados
    });
  }

  // 4. 🟢 CORREGIDO: Sincronización simétrica. Limpiamos los residuos de ID en AMBAS tablas espejo
  // Evita que queden IDs huérfanos o "fantasmas" en la base de datos
  await this.userRepository.update({ horario: { id: id } }, { horario: null }); 
await this.workerRepository.update(
    { horarioId: id } as any, 
    { horarioId: null } as any
  );  
  // 5. Borramos el horario físicamente. Al tener 'cascade: true' en tu entidad Horario, 
  // PostgreSQL purgará automáticamente las tablas dependientes ('distribucion_dia' y 'franjas').
  await this.horarioRepository.delete(id);
  
  return { 
    success: true, 
    message: `El horario "${horario.nombre}" ha sido eliminado correctamente.` 
  };
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
    await this.userRepository.update({ horario: { id: id } }, { horario: null });
    const result = await this.horarioRepository.delete({ id, empresaId });
    if (result.affected === 0) throw new NotFoundException(`No se encontró el horario con ID ${id}`);
    return { mensaje: 'Horario eliminado y usuarios desvinculados.' };
  }

  async obtenerSemanaActualDelTrabajador(workerId: number) {
  // 1. Buscamos al trabajador y traemos su Horario y los datos de su Usuario
  // Usamos el repositorio de User porque ahí suele estar la fecha de inicio
  const user = await this.userRepository.findOne({
    where: { id: workerId },
    relations: ['horario'], // Cargamos el objeto horario vinculado
  });

  if (!user || !user.horario) {
    throw new NotFoundException('El trabajador no existe o no tiene un horario asignado');
  }

  // 2. Extraemos los datos necesarios del objeto
  const fechaInicio = user.fechaInicioHorario; // El día que empezó su rotación
  const hoy = new Date();
  
  // Suponiendo que tu entidad Horario tiene un campo 'cantSemanas' (ej: 2, 4, 5)
  const totalSemanas = user.horario.semanasRotacion; 

  if (!fechaInicio) {
    throw new BadRequestException('El trabajador no tiene una fecha de inicio de rotación definida');
  }

  // 3. Calculamos la semana usando tu función matemática
  const semanaActual = this.calcularSemanaRotacion(fechaInicio, hoy, totalSemanas);

  return {
    trabajador: user.nombre,
    horarioNombre: user.horario.nombre,
    totalSemanasDelCiclo: totalSemanas,
    semanaActual: semanaActual, // Esto te dirá 1, 2, 3...
    proximaSemana: (semanaActual % totalSemanas) + 1
  };
}

// Tu función (mantenla igual, es correcta)


  async update(id: number, dto: Partial<CreateHorarioDto>, user: UserPayload) {
    if (!user.empresaId) throw new BadRequestException('Usuario sin empresa');

    if (dto.distribuciones) {
      for (const dist of dto.distribuciones) {
        this.validarJornadaCompleta(dist);
      }
    }

    const horarioExistente = await this.horarioRepository.findOne({
      where: { id, empresa: { id: user.empresaId } },
      relations: ['distribuciones', 'distribuciones.franjas'],
    });

    if (!horarioExistente) throw new NotFoundException(`Horario con ID ${id} no encontrado en tu empresa`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (dto.nombre) horarioExistente.nombre = dto.nombre;
      if (dto.tipo) horarioExistente.tipo = dto.tipo;
      if (dto.esRotativo !== undefined) horarioExistente.esRotativo = dto.esRotativo;
      if (dto.semanasRotacion !== undefined) horarioExistente.semanasRotacion = dto.semanasRotacion;

      await queryRunner.manager.save(horarioExistente);

      if (dto.distribuciones) {
        for (const dist of horarioExistente.distribuciones) {
          await queryRunner.manager.delete(FranjaHoraria, { distribucionDia: { id: dist.id } });
          await queryRunner.manager.delete(DistribucionDia, { id: dist.id });
        }

        for (const distDto of dto.distribuciones) {
          const nuevaDist = queryRunner.manager.create(DistribucionDia, {
            diaSemana: distDto.diaSemana as any,
            horasDia: distDto.horasDia,
            semanaRotacion: distDto.semanaRotacion ?? 1,
            horario: horarioExistente, 
          });

          const distGuardada = await queryRunner.manager.save(nuevaDist);

          if (distDto.franjas && distDto.franjas.length > 0) {
            const franjasInstances = distDto.franjas.map(fDto =>
              queryRunner.manager.create(FranjaHoraria, {
                inicio: fDto.inicio,
                fin: fDto.fin,
                distribucionDia: distGuardada,
              })
            );
            await queryRunner.manager.save(franjasInstances);
          }
        }
      }

      await queryRunner.commitTransaction();
      return await this.findOne(id, user.empresaId); 

    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(`No se pudo actualizar el horario: ${err.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  // ---------------------------------------------------------
  // MÉTODOS DE CÁLCULO Y ROTACIÓN (ESTADÍSTICAS)
  // --------------------------------------------------------- 

  async getHorasObjetivoSemanal(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['horario', 'horario.distribuciones'],
    });

    if (!user || !user.horario) throw new NotFoundException('El usuario no tiene un horario asignado.');

    // 🔥 FIX ROTACIÓN: Usamos el ancla de tiempo para saber en qué semana estamos
    const inicioCiclo = user.fechaInicioHorario || user.createdAt;
    const hoy = new Date();

    const semanaActual = this.calcularSemanaRotacion(inicioCiclo, hoy, user.horario.semanasRotacion);

    // Solo sumamos las horas de la semana activa en el ciclo
    const totalHoras = user.horario.distribuciones
      .filter(dist => dist.semanaRotacion === semanaActual) 
      .reduce((acc, dist) => acc + (Number(dist.horasDia) || 0), 0);

    return { userId, horarioNombre: user.horario.nombre, semanaActual, totalHoras };
  }

 async getHorasTrabajadasSemanales(userId: number) {
  const hoy = new Date();
  const inicioSemana = new Date(hoy);
  inicioSemana.setDate(hoy.getDate() - (hoy.getDay() === 0 ? 6 : hoy.getDay() - 1));
  inicioSemana.setHours(0, 0, 0, 0);

  // 1. Obtenemos las jornadas cerradas de la semana y la activa (si existe)
  const [registros, activa] = await Promise.all([
    this.dataSource.getRepository(Workday).find({
      where: { usuario: { id: userId }, inicio: MoreThanOrEqual(inicioSemana), fin: Not(IsNull()) },
    }),
    this.dataSource.getRepository(Workday).findOne({
      where: { usuario: { id: userId }, fin: IsNull() }
    })
  ]);

  // 2. Sumamos segundos de jornadas cerradas
  let totalSegundos = registros.reduce((acc, reg) => acc + (reg.total_segundos || 0), 0);

  // 3. 💡 SUMAR TIEMPO EN VIVO: Si está trabajando, sumamos lo que lleva hoy
  if (activa) {
    const segundosVivo = Math.floor((hoy.getTime() - activa.inicio.getTime()) / 1000);
    totalSegundos += segundosVivo;
  }

  const totalHoras = totalSegundos / 3600; // Directo de segundos a horas

  return {
    userId,
    totalHorasTrabajadas: parseFloat(totalHoras.toFixed(2)),
    totalSegundos, // Devolvemos segundos para consistencia
    desde: inicioSemana.toISOString().split('T')[0]
  };
}

  async getProgresoSemanal(userId: number) {
    const { totalHoras } = await this.getHorasObjetivoSemanal(userId);
    const { totalHorasTrabajadas } = await this.getHorasTrabajadasSemanales(userId);

    if (totalHoras === 0) return { porcentaje: 0, mensaje: 'Sin horas objetivo asignadas para esta semana.' };

    const porcentaje = (totalHorasTrabajadas / totalHoras) * 100;

    return {
      userId,
      horasObjetivo: totalHoras,
      horasTrabajadas: totalHorasTrabajadas,
      porcentaje: parseFloat(porcentaje.toFixed(2)),
      completado: porcentaje >= 100
    };
  }

  // ---------------------------------------------------------
  // MÉTODOS AUXILIARES Y MATEMÁTICOS
  // --------------------------------------------------------- 

  // 🔥 NUEVO: Método centralizado para obtener el turno exacto de un día
 async getTurnoHoy(usuarioId: number, fechaReferencia: Date) {
    const user = await this.userRepository.findOne({
      where: { id: usuarioId },
      relations: ['horario', 'horario.distribuciones', 'horario.distribuciones.franjas']
    });

    if (!user || !user.horario) return null;

    const { horario } = user;
    let semanaActual = 1;

    // 1. Usamos la fecha ancla del usuario (prioridad fechaInicioHorario)
    if (horario.esRotativo && horario.semanasRotacion > 0) {
      const fechaAncla = user.fechaInicioHorario || user.createdAt;
      semanaActual = this.calcularSemanaRotacion(fechaAncla, fechaReferencia, horario.semanasRotacion);
    }

    const dias = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    const nombreDia = dias[fechaReferencia.getDay()];

    const distribucion = horario.distribuciones.find(d => {
      const coincideDia = d.diaSemana === nombreDia;
      const coincideSemana = horario.esRotativo 
        ? d.semanaRotacion === semanaActual 
        : (d.semanaRotacion === 1 || !d.semanaRotacion);
      
      return coincideDia && coincideSemana;
    });

    if (!distribucion) return null;

    return {
      nombre: horario.nombre,
      semanaRotacion: semanaActual, 
      franjas: distribucion.franjas,
      horasDia: distribucion.horasDia
    };
  }
  public obtenerNombreDia(fecha: Date): string {
    const dias = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    return dias[fecha.getDay()];
  }


  /**
 * Ajusta manualmente la semana de rotación de un trabajador.
 * Esto recalcula la 'fechaInicioHorario' para que coincida con la semana deseada hoy.
 */
async ajustarSemanaRotacion(workerId: number, nuevaSemana: number) {
  // 1. Buscamos al usuario y su horario
  const user = await this.userRepository.findOne({
    where: { id: workerId },
    relations: ['horario'],
  });

  if (!user || !user.horario) {
    throw new NotFoundException('El trabajador no tiene un horario asignado.');
  }

  if (!user.horario.esRotativo) {
    throw new BadRequestException('Este horario no es rotativo, no se puede ajustar la semana.');
  }

  // 2. Validamos que la semana solicitada sea coherente (Ej: no pedir semana 5 en un ciclo de 4)
  if (nuevaSemana < 1 || nuevaSemana > user.horario.semanasRotacion) {
    throw new BadRequestException(
      `La semana debe estar entre 1 y ${user.horario.semanasRotacion}.`
    );
  }

  // 3. 🧠 LÓGICA DE RE-ANCLAJE (Luxon)
  // Queremos que HOY el cálculo dé como resultado 'nuevaSemana'.
  // Por tanto, la fecha de inicio debe ser el Lunes de esta semana menos (nuevaSemana - 1) semanas.
  
  const hoyLuxon = DateTime.now().setZone('Europe/Madrid');
  const lunesDeEstaSemana = hoyLuxon.startOf('week'); // Nos movemos al lunes actual 00:00

  // Si queremos que hoy sea la Semana 3, la Semana 1 tuvo que ser hace 2 semanas.
  const semanasHaciaAtras = nuevaSemana - 1;
  const nuevaFechaAncla = lunesDeEstaSemana.minus({ weeks: semanasHaciaAtras });

  // 4. Actualizamos el usuario
  user.fechaInicioHorario = nuevaFechaAncla.toJSDate();
  
  try {
    await this.userRepository.save(user);
    
    this.logger.log(`Semana ajustada para ${user.nombre}: Ahora en Semana ${nuevaSemana}`);

    return {
      ok: true,
      mensaje: `Rotación ajustada correctamente.`,
      detalles: {
        trabajador: user.nombre,
        semanaActual: nuevaSemana,
        nuevaFechaAncla: user.fechaInicioHorario.toISOString().split('T')[0],
        proximaSemana: (nuevaSemana % user.horario.semanasRotacion) + 1
      }
    };
  } catch (error) {
    throw new InternalServerErrorException('No se pudo actualizar la rotación del trabajador.');
  }
}

  private validarJornadaCompleta(distDto: any) {
    if (!distDto.franjas || distDto.franjas.length === 0) return;

    let minutosTotalesFranjas = 0;
    
    const franjasEnMinutos = distDto.franjas.map(f => {
      const [hIni, mIni] = f.inicio.split(':').map(Number);
      const [hFin, mFin] = f.fin.split(':').map(Number);
      return { inicio: hIni * 60 + mIni, fin: hFin * 60 + mFin, texto: `${f.inicio}-${f.fin}` };
    }).sort((a, b) => a.inicio - b.inicio);

    for (let i = 0; i < franjasEnMinutos.length; i++) {
      const actual = franjasEnMinutos[i];

      if (actual.fin <= actual.inicio) throw new BadRequestException(`La franja ${actual.texto} es inválida.`);

      if (i < franjasEnMinutos.length - 1) {
        const siguiente = franjasEnMinutos[i + 1];
        if (actual.fin > siguiente.inicio) {
          throw new BadRequestException(`Solapamiento detectado en el día ${distDto.diaSemana}: La franja ${actual.texto} choca con la franja ${siguiente.texto}.`);
        }
      }
      minutosTotalesFranjas += (actual.fin - actual.inicio);
    }

    const minutosObjetivo = distDto.horasDia * 60;
    if (minutosTotalesFranjas < minutosObjetivo) {
      throw new BadRequestException(`En el día ${distDto.diaSemana}, las franjas suman ${minutosTotalesFranjas / 60}h, pero el mínimo diario es ${distDto.horasDia}h.`);
    }
  }

 calcularSemanaRotacion(fechaInicioCiclo: Date, fechaObjetivo: Date, totalSemanasRotacion: number): number {
  // 1. Convertimos a Luxon y normalizamos al lunes de cada semana a las 00:00
  // startOf('week') en Luxon siempre devuelve el Lunes.
  const inicio = DateTime.fromJSDate(fechaInicioCiclo).setZone('Europe/Madrid').startOf('week');
  const objetivo = DateTime.fromJSDate(fechaObjetivo).setZone('Europe/Madrid').startOf('week');

  // 2. Calculamos la diferencia de semanas reales de calendario
  const diffInWeeks = Math.floor(objetivo.diff(inicio, 'weeks').weeks);

  // 3. Aplicamos el módulo y sumamos 1
  // Math.abs por si la fecha objetivo es menor (evitar resultados negativos)
  const semanasPasadas = Math.max(0, diffInWeeks);
  return (semanasPasadas % totalSemanasRotacion) + 1;
}

/**
 * Calcula el total de segundos teóricos que un trabajador debe cumplir 
 * en un rango de fechas, descontando los días de vacaciones/bajas aprobadas.
 */
async getTeoricoRange(usuarioId: number, inicio: Date, fin: Date): Promise<number> {
  let totalSegundos = 0;
  
  // 1. 🛡️ Buscar TODAS las ausencias aprobadas del usuario que se crucen con este periodo
  const ausenciasDelPeriodo = await this.ausenciaRepository.find({
    where: {
      usuario: { id: usuarioId },
      estado: AusenciaEstado.APROBADA, // 💡 Cambia a AusenciaEstado.APROBADA si usas Enum
      fechaInicio: LessThanOrEqual(fin) as any,
      fechaFin: MoreThanOrEqual(inicio) as any
    }
  });

  // Creamos una copia de la fecha de inicio para no mutar el objeto original
  let fechaActual = new Date(inicio);
  fechaActual.setHours(0, 0, 0, 0);

  // Recorremos día por día
  while (fechaActual <= fin) {
    // 2. 🛡️ Comprobar si el día actual cae dentro de alguna de las ausencias
    const esDiaDeAusencia = ausenciasDelPeriodo.some(ausencia => {
      // Normalizamos a principio del día para comparar fechas limpias
      const inicioAusencia = new Date(ausencia.fechaInicio).setHours(0,0,0,0);
      const finAusencia = new Date(ausencia.fechaFin).setHours(23,59,59,999);
      return fechaActual.getTime() >= inicioAusencia && fechaActual.getTime() <= finAusencia;
    });

    if (esDiaDeAusencia) {
      // Si está de vacaciones, este día el objetivo es 0 horas. Pasamos al siguiente.
      fechaActual.setDate(fechaActual.getDate() + 1);
      continue;
    }

    // 3. Obtenemos el turno que le toca este día específico
    const turno = await this.getTurnoHoy(usuarioId, fechaActual);

    // 4. Si tiene turno y tiene franjas horarias, las sumamos
    if (turno && turno.franjas) {
      turno.franjas.forEach(franja => {
        if (franja.inicio && franja.fin) {
          totalSegundos += this.calcularSegundosFranja(franja.inicio, franja.fin);
        }
      });
    }

    // Saltamos al día siguiente
    fechaActual.setDate(fechaActual.getDate() + 1);
  }

  return totalSegundos;
}

/**
 * Auxiliar para convertir franjas (HH:MM) en segundos totales
 */
private calcularSegundosFranja(inicio: string, fin: string): number {
  // "10:00:00" → split por : → [10, 0, 0]
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  return ((h2 * 60 + m2) - (h1 * 60 + m1)) * 60;
}


/**
 * Obtiene todos los trabajadores asignados a un horario específico
 */
async findWorkersBySchedule(horarioId: number, empresaId: number) {
  // 1. Verificamos primero si el horario existe y pertenece a la empresa (Seguridad)
  const horario = await this.horarioRepository.findOne({
    where: { id: horarioId, empresa: { id: empresaId } }
  });

  if (!horario) {
    throw new NotFoundException(`El horario con ID ${horarioId} no existe en tu empresa.`);
  }

  // 2. Buscamos los usuarios/workers que tienen ese horario_id
  const trabajadores = await this.userRepository.find({
    where: { 
      horario: { id: horarioId },
      empresaId: empresaId 
    },
    select: ['id', 'nombre', 'apellidos', 'email', 'dni', 'rol', 'isActive'],
    order: { nombre: 'ASC' }
  });

  return {
    horario: horario.nombre,
    total: trabajadores.length,
    trabajadores
  };
}

}