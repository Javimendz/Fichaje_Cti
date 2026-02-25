import { InjectRepository } from "@nestjs/typeorm";
import { Alarm, AlarmType } from "./entities/alarm.entity";
import { In, MoreThan, MoreThanOrEqual, Repository } from "typeorm";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class AlarmsService {
  constructor(
    @InjectRepository(Alarm)
    private readonly alarmRepository: Repository<Alarm>,
  ) {}

  // Generar una alarma de forma manual o automática
  async triggerAlarm(
    usuarioId: number, 
    empresaId: number, 
    tipo: AlarmType, 
    descripcion: string
  ) {
    const alarma = this.alarmRepository.create({
      usuario: { id: usuarioId } as any,
      empresaId,
      tipo,
      descripcion,
    });
    return await this.alarmRepository.save(alarma);
  }

async verificarAlarmaHoy(usuarioId: number, tipo: AlarmType, inicioDelDia: Date): Promise<boolean> {
    const alarma = await this.alarmRepository.findOne({
      where: {
        usuario: { id: usuarioId },
        tipo: tipo,
        createdAt: MoreThanOrEqual(inicioDelDia)
      }
    });
    // Devuelve true si la alarma ya existe, false si no existe
    return alarma !== null; 
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
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return await this.alarmRepository.update(
    {
      usuario: { id: usuarioId },
      tipo: In([...tipos]), // Necesitas importar 'In' de typeorm
      revisada: false,
      createdAt: MoreThan(hoy) // Necesitas importar 'MoreThan' de typeorm
    },
    { 
      revisada: true, 
      descripcion: "CONSOLIDADA: El trabajador finalmente fichó."    }
  );
}
  
}