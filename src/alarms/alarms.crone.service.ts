import { Injectable, Logger } from "@nestjs/common";
import { AlarmsService } from "./alarms.service";
import { Cron } from '@nestjs/schedule'; 
import { AlarmType } from "./entities/alarm.entity";
import { UserRole } from "auth/roles.enum";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "users/entities/user.entity";
import { Repository } from "typeorm";
import { Attendance } from "attendance/entities/attendance.entity";

@Injectable()
export class AlarmCronService {
private readonly logger = new Logger('CronAlarmas');
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    private readonly alarmService: AlarmsService,
  ) {}

 @Cron('0 10 * * 1-5')
  async checkMorningAbsences() {
    console.log('--- EJECUTANDO CRON DE PRUEBA ---');
    this.logger.log('Iniciando escaneo de ausencias no notificadas...');

    const hoy = new Date().toLocaleDateString('en-CA');

    // 1. Buscamos todos los trabajadores activos (excluimos Admins y SuperAdmins)
    const trabajadores = await this.userRepository.find({
      where: { rol: UserRole.WORKER, isActive: true },
    });

    for (const worker of trabajadores) {
      // 2. Verificamos si este trabajador tiene algún registro hoy
      const fichaje = await this.attendanceRepository.findOne({
        where: { usuarioId: worker.id, fechaJornada: hoy },
      });

      // 3. Si no hay registro, ¡disparamos alarma de olvido!
      if (!fichaje) {
        await this.alarmService.triggerAlarm(
          worker.id,
          worker.empresaId,
          AlarmType.ABSENCE, // O podrías crear uno nuevo: AlarmType.MISSING_PUNCH
          `SISTEMA: El trabajador ${worker.nombre} no ha registrado su asistencia a las 10:00 AM.`
        );
        this.logger.warn(`Alarma generada para el trabajador ID: ${worker.id}`);
      }
    }
    
    this.logger.log('Escaneo de ausencias completado.');
  }

}