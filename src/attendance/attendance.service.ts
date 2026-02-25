import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UserPayload } from 'auth/interfaces/user-payload.interface';
import { AlarmType } from 'alarms/entities/alarm.entity';
import { AlarmsService } from 'alarms/alarms.service';
import { User } from 'auth/entities/user.entity';

@Injectable()
export class AttendanceService {
  [x: string]: any;
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly alarmService: AlarmsService,
  ) {}

  // --- CREAR ASISTENCIA UNIFICADO: ADMIN Y WORKER ---
  async create(userPayload: UserPayload, dto: CreateAttendanceDto) {
    if (!userPayload.empresaId) {
      throw new BadRequestException('No puedes fichar: no tienes una empresa asignada.');
    }

    const hoy = new Date().toLocaleDateString('en-CA');
    const ahora = new Date();
    const horaActual = ahora.toLocaleTimeString('en-GB'); // Formato "HH:mm:ss"

    // 1. Buscamos al usuario en DB con su horario y empresa
    const usuarioDB = await this.userRepository.findOne({
      where: { id: userPayload.id },
      relations: ['horario', 'horario.distribuciones', 'horario.distribuciones.franjas', 'empresa']
    });

    if (!usuarioDB) {
      throw new BadRequestException('El usuario no existe o no ha podido ser verificado.');
    }

    // --- 🌍 VALIDACIÓN DE GEOLOCALIZACIÓN ---
    if (dto.presente && dto.lat && dto.lng && usuarioDB.empresa?.latitud) {
      const distancia = this.calcularDistancia(
        dto.lat, dto.lng,
        usuarioDB.empresa.latitud, usuarioDB.empresa.longitud
      );

      this.logger.log(`Usuario ${usuarioDB.nombre} fichando a ${distancia.toFixed(2)} metros de la sede.`);

      if (distancia > usuarioDB.empresa.radioPermitido) {
        await this.alarmService.triggerAlarm(
          userPayload.id,
          userPayload.empresaId,
          AlarmType.UNAUTHORIZED_ZONE,
          `ZONA NO AUTORIZADA: Fichaje realizado a ${distancia.toFixed(0)} metros de la oficina (Radio permitido: ${usuarioDB.empresa.radioPermitido}m).`
        );
      }
    }

    // 2. Mapeo de horario para el día actual
    const diaJS = ahora.getDay();
    const mapeoDias: Record<number, string> = { 
      1: 'LUNES', 2: 'MARTES', 3: 'MIERCOLES', 4: 'JUEVES', 5: 'VIERNES', 6: 'SABADO', 0: 'DOMINGO' 
    };
    const distHoy = usuarioDB?.horario?.distribuciones?.find(d => d.diaSemana === mapeoDias[diaJS]);

    // 3. Verificamos si ya tiene un fichaje hoy para decidir si es ENTRADA o SALIDA
    const existing = await this.attendanceRepository.findOne({
      where: { usuarioId: userPayload.id, fechaJornada: hoy }
    });

    // ==========================================
    // ESCENARIO 1: FICHAJE DE SALIDA
    // ==========================================
    if (existing) {
      if (existing.horaSalida) {
        throw new ConflictException(`Ya has completado tu jornada de hoy (${hoy}).`);
      }

      existing.horaSalida = horaActual;
      const savedSalida = await this.attendanceRepository.save(existing);

      // 🔔 Comprobar Salida Anticipada
      if (distHoy && distHoy.franjas && distHoy.franjas.length > 0) {
        const ultimaFranja = distHoy.franjas[distHoy.franjas.length - 1];
        if (ultimaFranja.fin) {
          const margenCortesia = 5;
          const esPronto = this.comprobarSalidaAnticipada(ultimaFranja.fin, margenCortesia);

          if (esPronto) {
            await this.alarmService.triggerAlarm(
              userPayload.id,
              userPayload.empresaId,
              AlarmType.EARLY_DEPARTURE,
              `SALIDA ANTICIPADA: Ha fichado salida a las ${horaActual} (Su turno terminaba a las ${ultimaFranja.fin}).`
            );
          }
        }
      }
      return savedSalida;
    }

    // ==========================================
    // ESCENARIO 2: FICHAJE DE ENTRADA
    // ==========================================
    const record = new Attendance();
    record.presente = dto.presente;
    record.motivo = dto.motivo;
    record.usuarioId = userPayload.id;
    record.empresaId = userPayload.empresaId;
    record.fechaJornada = hoy;
    record.horaEntrada = horaActual;

    const savedEntrada = await this.attendanceRepository.save(record);

    // 🛡️ Autolimpieza: Si ficha, resolvemos alarmas de "Ausencia" creadas por el Cron hoy
    await this.alarmService.resolverAlarmasPrevias(userPayload.id, [AlarmType.ABSENCE]);

    // 🔔 Comprobar Ausencia Manual o Retraso
    if (dto.presente === false) {
      await this.alarmService.triggerAlarm(
        userPayload.id,
        userPayload.empresaId,
        AlarmType.ABSENCE,
        `El trabajador ${userPayload.email} ha registrado una AUSENCIA. Motivo: ${dto.motivo || 'No especificado'}`
      );
    } 
    else if (dto.presente === true && distHoy) {
      const primeraFranja = distHoy.franjas[0];
      if (primeraFranja && primeraFranja.inicio) {
        const margenCortesia = 10;
        const esTarde = this.comprobarRetraso(primeraFranja.inicio, margenCortesia);

        if (esTarde) {
          await this.alarmService.triggerAlarm(
            userPayload.id,
            userPayload.empresaId,
            AlarmType.LATE_ARRIVAL,
            `RETRASO: Ha fichado entrada a las ${horaActual} (Entrada teórica: ${primeraFranja.inicio}).`
          );
        }
      }
    }

    return savedEntrada;
  }

  // --- HISTORIAL PERSONAL: ADMIN Y WORKER ---
  async findAllByUser(targetUserId: number, adminEmpresaId: number) {
    return await this.attendanceRepository.find({
      where: { 
        usuarioId: targetUserId, 
        empresaId: adminEmpresaId 
      },
      order: { fechaJornada: 'DESC' },
    });
  }

  // --- HISTORIAL DE EMPRESA: SOLO ADMIN ---
  async findAllByEmpresa(empresaId: number) {
    return await this.attendanceRepository.find({
      where: { empresaId },
      relations: ['usuario'],
      order: { fechaJornada: 'DESC' }
    });
  }

  // --- MÉTODO AUXILIAR ---
  private comprobarRetraso(horaTeorica: string, margen: number): boolean {
    const ahora = new Date();
    const [h, m] = horaTeorica.split(':').map(Number);
    const minutosTeoricos = (h * 60) + m + margen;
    const minutosActuales = (ahora.getHours() * 60) + ahora.getMinutes();
    
    return minutosActuales > minutosTeoricos;
  }

  private comprobarSalidaAnticipada(horaTeoricaFin: string, margen: number): boolean {
    const ahora = new Date();
    const [h, m] = horaTeoricaFin.split(':').map(Number);
    // Le restamos el margen a la hora de salida. Ej: si sale a las 18:00 y margen es 5, 
    // su límite para fichar sin alarma es a partir de las 17:55.
    const minutosTeoricos = (h * 60) + m - margen; 
    const minutosActuales = (ahora.getHours() * 60) + ahora.getMinutes();
    
    // Es "pronto" si los minutos actuales son MENORES que el límite
    return minutosActuales < minutosTeoricos; 
  }

  private calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

}