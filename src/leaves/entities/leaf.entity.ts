import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from 'users/entities/user.entity';

export enum LeaveStatus {
  PENDING = 'PENDIENTE',
  APPROVED = 'APROBADO',
  REJECTED = 'RECHAZADO'
}

export enum LeaveType {
  VACATION = 'VACACIONES',
  SICK_LEAVE = 'ENFERMEDAD',
  PERSONAL_DAYS = 'ASUNTOS_PROPIOS',
  PUBLIC_HOLIDAY = 'FESTIVO'
}

@Entity('leaves')
export class Leave {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  fecha: string; // Guardamos el día específico del permiso

  @Column({ type: 'enum', enum: LeaveType, default: LeaveType.VACATION })
  tipo: LeaveType;

  @Column({ type: 'enum', enum: LeaveStatus, default: LeaveStatus.APPROVED })
  estado: LeaveStatus;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  @Column({ name: 'usuario_id' })
  usuarioId: number;
}