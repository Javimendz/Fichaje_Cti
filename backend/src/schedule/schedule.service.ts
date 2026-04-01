import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThanOrEqual, IsNull, Not, LessThanOrEqual } from 'typeorm'; 
import { Horario } from './entities/schedules.entity';
import { CreateHorarioDto } from './dto/create-schedule.dto';
import type { UserPayload } from '../auth/interfaces/user-payload.interface'; 
import { FranjaHoraria } from 'timeSlot/entities/franja-horaria.entity';
import { User } from 'auth/entities/user.entity';
import { Workday } from 'workday/entities/workday.entity';
import { DistribucionDia } from './entities/distribucion-dia.entity';
import { DateTime } from 'luxon';
import { Ausencia } from 'absence/entities/ausencia.entity';
import { AusenciaEstado } from 'absence/dto/ausencia-estado.enum';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Horario) private readonly horarioRepository: Repository<Horario>,
    private readonly dataSource: DataSource,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(FranjaHoraria) private readonly franjaRepo: Repository<FranjaHoraria>,
    @InjectRepository(Ausencia) private readonly ausenciaRepository: Repository<Ausencia>
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
    } catch (err) {
      console.error('🔥 ERROR REAL EN BASE DE DATOS:', err);
      throw new BadRequestException(`No se pudo crear el horario: ${err.message}`);
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
    await this.userRepository.update({ horario: { id: id } }, { horario: null });
    const result = await this.horarioRepository.delete({ id, empresaId });
    if (result.affected === 0) throw new NotFoundException(`No se encontró el horario con ID ${id}`);
    return { mensaje: 'Horario eliminado y usuarios desvinculados.' };
  }

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

    } catch (err) {
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
    const horario = await this.horarioRepository.findOne({ 
      where: { usuarios: { id: usuarioId } },
      relations: ['distribuciones', 'distribuciones.franjas']
    });

    if (!horario) return null;

    // 1. ASUMIMOS SEMANA 1 POR DEFECTO (Para horarios continuos o partidos)
    let semanaActual = 1;

    // 2. SOLO CALCULAMOS MATEMÁTICAS SI ES ROTATIVO
    if (horario.esRotativo && horario.semanasRotacion > 0) {
      const ancla = DateTime.fromJSDate(horario.createdAt)
        .setZone('Europe/Madrid')
        .startOf('week'); 

      const referencia = DateTime.fromJSDate(fechaReferencia)
        .setZone('Europe/Madrid')
        .startOf('week'); 

      const semanasTranscurridas = Math.floor(referencia.diff(ancla, 'weeks').weeks);
      semanaActual = (Math.max(0, semanasTranscurridas) % horario.semanasRotacion) + 1;
    }

    const dias = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    const nombreDia = dias[
      DateTime.fromJSDate(fechaReferencia).setZone('Europe/Madrid').weekday % 7
    ];

    // 3. BUSCAMOS LA DISTRIBUCIÓN CON LÓGICA FLEXIBLE
    const distribucion = horario.distribuciones.find(d => {
      const coincideDia = d.diaSemana === nombreDia;
      // Si es rotativo, debe coincidir la semana exacta. Si no, debe ser la 1 (o sin semana asignada)
      const coincideSemana = horario.esRotativo 
        ? d.semanaRotacion === semanaActual 
        : (d.semanaRotacion === 1 || !d.semanaRotacion);
      
      return coincideDia && coincideSemana;
    });

    if (!distribucion || !distribucion.esLaborable) return null;

    return {
      nombre: horario.nombre,
      semanaRotacion: semanaActual, 
      franjas: distribucion.franjas
    };
  }
  public obtenerNombreDia(fecha: Date): string {
    const dias = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    return dias[fecha.getDay()];
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
    const msPorSemana = 1000 * 60 * 60 * 24 * 7;
    const diferenciaMs = fechaObjetivo.getTime() - fechaInicioCiclo.getTime();
    const semanasPasadas = Math.max(0, Math.floor(diferenciaMs / msPorSemana));
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

}