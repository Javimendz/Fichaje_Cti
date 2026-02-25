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

    // 1. Evitar fichajes duplicados en el mismo día
    const existing = await this.attendanceRepository.findOne({
      where: { usuarioId: userPayload.id, fechaJornada: hoy }
    });

    if (existing) {
      throw new ConflictException(`Ya has registrado tu asistencia para hoy (${hoy}).`);
    }

    // 2. Buscamos al usuario en DB con su horario para poder comprobar retrasos
    const usuarioDB = await this.userRepository.findOne({
      where: { id: userPayload.id },
      relations: ['horario', 'horario.distribuciones', 'horario.distribuciones.franjas']
    });

    // 3. Creamos y guardamos el registro de asistencia
    const record = new Attendance();
    record.presente = dto.presente;
    record.motivo = dto.motivo;
    record.usuarioId = userPayload.id;
    record.empresaId = userPayload.empresaId;
    record.fechaJornada = hoy;

    const savedRecord = await this.attendanceRepository.save(record);

    // 4. 🔔 LÓGICA DE ALARMAS (El cerebro del sistema)
    
    // ESCENARIO A: El trabajador avisa que no va a ir (Ausencia Manual)
    if (dto.presente === false) {
      await this.alarmService.triggerAlarm(
        userPayload.id,
        userPayload.empresaId,
        AlarmType.ABSENCE, 
        `El trabajador ${userPayload.email} ha registrado una AUSENCIA. Motivo: ${dto.motivo || 'No especificado'}`
      );
    } 
    // ESCENARIO B: El trabajador ficha entrada. Comprobamos si llega tarde.
    else if (dto.presente === true && usuarioDB?.horario) {
      const ahora = new Date();
      const diaJS = ahora.getDay();
      const mapeoDias: Record<number, string> = { 1:'LUNES', 2:'MARTES', 3:'MIERCOLES', 4:'JUEVES', 5:'VIERNES', 6:'SABADO', 0:'DOMINGO' };
      
      const distHoy = usuarioDB.horario.distribuciones?.find(d => d.diaSemana === mapeoDias[diaJS]);
      const primeraFranja = distHoy?.franjas?.[0];

      if (primeraFranja && primeraFranja.inicio) {
        const margenCortesia = 10; // 10 minutos de gracia
        const esTarde = this.comprobarRetraso(primeraFranja.inicio, margenCortesia);

        if (esTarde) {
          await this.alarmService.triggerAlarm(
            userPayload.id,
            userPayload.empresaId,
            AlarmType.LATE_ARRIVAL,
            `RETRASO: El trabajador ha fichado a las ${ahora.toLocaleTimeString()} (Entrada teórica: ${primeraFranja.inicio}).`
          );
        }
      }
    }

    return savedRecord;
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
}