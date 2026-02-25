import { InjectRepository } from "@nestjs/typeorm";
import { Alarm, AlarmType } from "./entities/alarm.entity";
import { In, MoreThan, MoreThanOrEqual, Repository } from "typeorm";
import { Injectable, NotFoundException } from "@nestjs/common";
import { AlarmsGateway } from "./gateway/alarms.gateway";

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

@Injectable()
export class AlarmsService {
  constructor(
    @InjectRepository(Alarm)
    private readonly alarmRepository: Repository<Alarm>,
    private readonly alarmsGateway: AlarmsGateway,
    
  ) {}

  // Generar una alarma de forma manual o automática
 async triggerAlarm(usuarioId: number, empresaId: number, tipo: AlarmType, descripcion: string) {
  // Opcional: Validar si ya existe una alarma idéntica muy reciente para evitar spam
  const haceCincoMinutos = new Date(Date.now() - 5 * 60000);
  
  const duplicada = await this.alarmRepository.findOne({
    where: {
      usuario: { id: usuarioId },
      tipo,
      createdAt: MoreThan(haceCincoMinutos)
    }
  });

  if (duplicada) return duplicada; // Si ya existe una reciente, no creamos otra

  const alarma = this.alarmRepository.create({
    usuario: { id: usuarioId },
    empresaId,
    tipo,
    descripcion,
  });

  const savedAlarm = await this.alarmRepository.save(alarma);

  this.alarmsGateway.sendAlarmToAdmin(empresaId, savedAlarm);

  return savedAlarm;

}
async verificarAlarmaHoy(usuarioId: number, tipo: AlarmType, inicioDelDia: Date): Promise<boolean> {
    const alarma = await this.alarmRepository.findOne({
      where: {
        usuario: { id: usuarioId },
        tipo: tipo,
        createdAt: MoreThanOrEqual(inicioDelDia)
      }
    });
    return !!alarma; 
  }
  // Listar alarmas para el administrador de la empresa
  async findAllByCompany(empresaId: number) {
    return await this.alarmRepository.find({
      where: { empresaId, revisada: false },
      relations: ['usuario'],
      order: { createdAt: 'DESC' }
    });
  }

  async markAsRead(id: number, empresaId: number) {
    return await this.alarmRepository.update({ id, empresaId }, { revisada: true });
  }


async resolverAlarmasPrevias(usuarioId: number, tipos: AlarmType[]) {
  // Usamos dayjs para asegurar la zona horaria correcta
  const hoy = dayjs().tz('Europe/Madrid').startOf('day').toDate();

  return await this.alarmRepository.update(
    {
      usuario: { id: usuarioId },
      tipo: In(tipos),
      revisada: false,
      createdAt: MoreThan(hoy) // 👈 Ahora sí compara con la medianoche de España
    },
    { 
      revisada: true, 
      descripcion: "CONSOLIDADA: El trabajador finalmente fichó." 
    }
  );
}

async countPendingToday(empresaId: number): Promise<number> {
  const inicioDia = dayjs().tz('Europe/Madrid').startOf('day').toDate();

  return await this.alarmRepository.count({
    where: { empresaId, revisada: false, createdAt: MoreThanOrEqual(inicioDia) }
  });
}

async findPending(empresaId: number) {
    return await this.alarmRepository.find({
      where: { empresaId, revisada: false },
      relations: ['usuario'],
      order: { createdAt: 'DESC' }
    });
  }

async resolve(id: number, nota: string, empresaId: number) {
  // Validamos que la alarma exista Y sea de la empresa del Admin que lo solicita
  const alarma = await this.alarmRepository.findOne({ 
    where: { id, empresaId } 
  });
  
  if (!alarma) {
    throw new NotFoundException('Alarma no encontrada en su empresa');
  }
  
  alarma.revisada = true;
  alarma.descripcion += ` | NOTA ADMIN: ${nota}`;
  
  return await this.alarmRepository.save(alarma);
}
}