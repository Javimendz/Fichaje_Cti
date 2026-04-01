import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from 'users/entities/user.entity';
import { Company } from 'company/entities/company.entity';

// AlarmType
// Enum para representar los diferentes tipos de alarmas disponibles en el sistema.
// Cada valor en este enum corresponde a un tipo específico de alarma que puede generarse
// en función de ciertas condiciones, como la detección de ausencia, retardo, zona no autorizada
// o salida anticipada. Estos tipos se utilizan para clasificar y manejar alarmas de manera
// organizada y eficiente en el sistema.  
//
// Valores:
// - ABSENCE: AUSENCIA_DETECTADA
// - LATE_ARRIVAL: RETRASO
// - UNAUTHORIZED_ZONE: ZONA_NO_AUTORIZADA
// - EARLY_DEPARTURE: SALIDA_ANTICIPADA 

export enum AlarmType {
  ABSENCE = 'AUSENCIA_DETECTADA',
  LATE_ARRIVAL = 'RETRASO',
  UNAUTHORIZED_ZONE = 'ZONA_NO_AUTORIZADA',
  EARLY_DEPARTURE = 'SALIDA_ANTICIPADA',
  WEEKLY_HOURS_INCOMPLETE = 'HORAS_SEMANALES_INCOMPLETAS',
  MONTHLY_HOURS_INCOMPLETE = 'HORAS_MENSUALES_INCOMPLETAS',
}
// Alarm
// Entidad para representar una alarma generada en el sistema.
// Cada alarma registra un evento importante que requiere atención, como la detección de ausencia,
// retardo, zona no autorizada o salida anticipada. Las alarmas se utilizan para notificar a los
// usuarios sobre eventos críticos y permitir que tomen medidas preventivas o correctivas en consecuencia.
//
// Propiedades:
// - id: Identificador único de la alarma.
// - tipo: Tipo de alarma, representado por el enum AlarmType.
// - descripcion: Descripción detallada de la alarma, incluyendo información relevante sobre el evento.
// - leidaAdmin: Indica si la alarma ha sido leída por el administrador.
// - leidaWorker: Indica si la alarma ha sido leída por el trabajador.
// - empresaId: Identificador de la empresa a la que pertenece la alarma.
// - createdAt: Fecha y hora en que se creó la alarma.
// - usuario: Usuario que generó la alarma.
// - empresa: Empresa a la que pertenece la alarma. 
@Entity('alarms')
export class Alarm {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: AlarmType })
  tipo: AlarmType;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ default: false, name: 'leida_admin' })
  leidaAdmin: boolean;

  @Column({ default: false, name: 'leida_worker' })
  leidaWorker: boolean;

  @Column({ name: 'empresa_id' })
  empresaId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, {onDelete: 'CASCADE', 
    nullable: false})
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  @ManyToOne(() => Company, {onDelete: 'CASCADE'})
  @JoinColumn({ name: 'empresa_id' })
  empresa: Company;
}