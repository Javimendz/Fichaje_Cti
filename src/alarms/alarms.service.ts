/**
 * Servicio para la gestión de alarmas del sistema de fichaje.
 * 
 * Proporciona funcionalidades para:
 * - Crear y disparar alarmas (manuales o automáticas)
 * - Validar alarmas duplicadas
 * - Consultar alarmas por empresa y usuario
 * - Marcar alarmas como leídas/resueltas
 * - Contar alarmas pendientes
 * 
 * @class AlarmsService
 */




import { InjectRepository } from "@nestjs/typeorm";
import { Alarm, AlarmType } from "./entities/alarm.entity";
import { In, MoreThan, MoreThanOrEqual, Repository } from "typeorm";
import { Injectable, NotFoundException } from "@nestjs/common";
import { AlarmsGateway } from "./gateway/alarms.gateway";

import dayjs from 'dayjs';

// 
@Injectable()
/**
 * Servicio para la gestión de alarmas en el sistema.
 * 
 * Este servicio proporciona métodos para crear, verificar, listar, 
 * resolver y contar alarmas asociadas a usuarios y empresas. 
 * Incluye lógica para evitar la creación de alarmas duplicadas 
 * en un corto período de tiempo y para consolidar alarmas previas.
 * 
 * Funcionalidades principales:
 * - Crear alarmas manual o automáticamente.
 * - Verificar si existen alarmas de un tipo específico para un usuario en un día.
 * - Listar alarmas pendientes para una empresa.
 * - Marcar alarmas como revisadas.
 * - Resolver alarmas previas de un usuario.
 * - Contar alarmas pendientes de revisión en un día.
 * - Resolver una alarma específica con una nota administrativa.
 * 
 * Este servicio utiliza un repositorio de alarmas para interactuar con la base de datos
 * y un gateway para notificar a los administradores en tiempo real.
 */
export class AlarmsService {
  constructor(
    @InjectRepository(Alarm)
    private readonly alarmRepository: Repository<Alarm>,
    private readonly alarmsGateway: AlarmsGateway,
    
  ) {}

  // Generar una alarma de forma manual o automática
/**
 * Triggers an alarm for a user within an organization.
 * 
 * Prevents alarm spam by checking if an identical alarm was already created
 * within the last 5 minutes. If a duplicate is found, returns the existing alarm
 * instead of creating a new one.
 * 
 * @param usuarioId - The ID of the user triggering the alarm
 * @param empresaId - The ID of the organization/company
 * @param tipo - The type of alarm to trigger
 * @param descripcion - A description of the alarm event
 * 
 * @returns A promise that resolves to the created or existing alarm object
 * 
 * @example
 * const alarm = await this.triggerAlarm(1, 5, AlarmType.WARNING, 'Unauthorized access attempt');
 */
 async triggerAlarm(usuarioId: number, empresaId: number, tipo: AlarmType, descripcion: string) {
  //  Validar si ya existe una alarma idéntica muy reciente para evitar spam
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
    revisada: false,
    descripcion,
  });

  const savedAlarm = await this.alarmRepository.save(alarma);

  this.alarmsGateway.sendAlarmToAdmin(empresaId, savedAlarm);

  return savedAlarm;

}


/**
 * Verifica si existe una alarma del tipo especificado para el usuario en el día actual.
 * 
 * @param usuarioId - El identificador único del usuario.
 * @param tipo - El tipo de alarma a verificar.
 * @param inicioDelDia - La fecha y hora del inicio del día a partir de la cual buscar alarmas.
 * @returns Una promesa que se resuelve en `true` si existe al menos una alarma del tipo especificado
 *          para el usuario creada desde el inicio del día, `false` en caso contrario.
 */
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
  /**
   * Obtiene todas las alarmas sin revisar de una empresa específica.
   * @param empresaId - Identificador único de la empresa
   * @returns Promesa que se resuelve con un array de alarmas ordenadas por fecha de creación descendente
   */
  async findAllByCompany(empresaId: number) {
    return await this.alarmRepository.find({
      where: { empresaId, revisada: false },
      relations: ['usuario'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Marca una alarma como revisada en la base de datos.
   *
   * @param id - El identificador único de la alarma.
   * @param empresaId - El identificador de la empresa asociada a la alarma.
   * @returns Una promesa que resuelve con el resultado de la operación de actualización.
   */
  async markAsRead(id: number, empresaId: number) {
    return await this.alarmRepository.update({ id, empresaId }, { revisada: true });
  }


/**
 * Resuelve las alarmas previas de un usuario marcándolas como revisadas.
 * 
 * Busca todas las alarmas no revisadas del usuario creadas hoy (después de las 00:00 en zona horaria Europe/Madrid)
 * que coincidan con los tipos especificados y las marca como revisadas con una descripción de consolidación.
 * 
 * @param usuarioId - El ID del usuario propietario de las alarmas
 * @param tipos - Array de tipos de alarma a resolver
 * @returns Promise con el resultado de la actualización (cantidad de alarmas actualizadas)
 * 
 * @example
 * await this.resolverAlarmasPrevias(1, [AlarmType.FALTA_FICHAJE]);
 */
async resolverAlarmasPrevias(usuarioId: number, tipos: AlarmType[]) {
  // Usamos dayjs para asegurar la zona horaria correcta
  const hoy = dayjs().tz('Europe/Madrid').startOf('day').toDate();

  return await this.alarmRepository.update(
    {
      usuario: { id: usuarioId },
      tipo: In(tipos),
      revisada: false,
      createdAt: MoreThan(hoy) 
    },
    { 
      revisada: true, 
      descripcion: "CONSOLIDADA: El trabajador finalmente fichó." 
    }
  );
}

/**
 * Cuenta el número de alarmas pendientes de revisar creadas hoy para una empresa específica.
 * @param empresaId - El identificador único de la empresa
 * @returns Una promesa que se resuelve con el número de alarmas pendientes creadas durante el día actual
 * en la zona horaria de Europa/Madrid
 */
async countPendingToday(empresaId: number): Promise<number> {
  const inicioDia = dayjs().tz('Europe/Madrid').startOf('day').toDate();

  return await this.alarmRepository.count({
    where: { empresaId, revisada: false, createdAt: MoreThanOrEqual(inicioDia) }
  });
}

/**
 * Encuentra todas las alarmas pendientes de revisión para una empresa específica.
 * @param empresaId - El identificador de la empresa
 * @returns Una promesa que se resuelve con un array de alarmas pendientes ordenadas por fecha de creación descendente
 * @remarks Las alarmas se cargan con sus relaciones de usuario asociadas
 */
async findPending(empresaId: number) {
    return await this.alarmRepository.find({
      where: { empresaId, revisada: false },
      relations: ['usuario'],
      order: { createdAt: 'DESC' }
    });
  }

/**
 * Resuelve una alarma marcándola como revisada y añadiendo una nota del administrador.
 * 
 * @param id - El identificador único de la alarma a resolver
 * @param nota - La nota que el administrador desea añadir a la alarma
 * @param empresaId - El identificador de la empresa propietaria de la alarma
 * 
 * @returns Una promesa que se resuelve con la alarma actualizada
 * 
 * @throws {NotFoundException} Si la alarma no existe o no pertenece a la empresa especificada
 * 
 * @remarks
 * La alarma se marca como revisada (revisada = true) y la nota del administrador
 * se concatena a la descripción existente de la alarma con el prefijo "NOTA ADMIN:".
 * Este método valida que la alarma pertenezca a la empresa del administrador que lo solicita
 * para garantizar la seguridad de los datos.
 */
// Resolver una alarma con una nota del administrador
// Resolver una alarma con una nota del administrador

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