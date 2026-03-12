import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  DeleteDateColumn,
} from 'typeorm';
import { User } from 'users/entities/user.entity';

export enum IncidenciaTipo {
  // --- RELACIONADAS CON EL HORARIO ---
  TARDANZA = 'TARDANZA',                 // Llegada después de la hora
  SALIDA_ANTICIPADA = 'SALIDA_ANTICIPADA', // Salida antes de la hora
  HORAS_EXTRAS_NO_AUTORIZADAS = 'HORAS_EXTRAS_NO_AUTORIZADAS',

  // --- RELACIONADAS CON EL MARCAJE (ERRORES) ---
  OLVIDO_ENTRADA = 'OLVIDO_ENTRADA',     // El empleado vino pero no marcó
  OLVIDO_SALIDA = 'OLVIDO_SALIDA',       // Se fue y dejó el turno abierto
  MARCA_DUPLICADA = 'MARCA_DUPLICADA',   // Marcó dos veces por error
  ERROR_GPS = 'ERROR_GPS',               // No se pudo validar la ubicación

  // --- AUSENCIAS Y PERMISOS ---
  AUSENCIA = 'AUSENCIA', // No vino, no avisó
  PERMISO_PARTICULAR = 'PERMISO_PARTICULAR',     // Trámites personales
  VACACIONES = 'VACACIONES',
  BAJA_MEDICA = 'BAJA_MEDICA',

  // --- FALLOS TÉCNICOS ---
  FALLO_DISPOSITIVO = 'FALLO_DISPOSITIVO', // Tablet/Móvil roto o sin batería
  SIN_INTERNET = 'SIN_INTERNET',           // El lugar de trabajo no tenía conexión
  ERROR_APP = 'ERROR_APP',                 // La aplicación se cerró o dio error

  // --- OTROS ---
  OTROS = 'OTROS'
}
@Entity('incidencias')
@Index(['userId', 'createdAt'])
export class Issue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: IncidenciaTipo })
  tipo: IncidenciaTipo;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'empresa_id' })
  empresaId: number;

  @Column({ type: 'text', nullable: true })
  nombre: string | null;

  @Column({ type: 'text', nullable: true })
  apellidos: string | null;

  @DeleteDateColumn()
  deletedAt: Date;

  @Column({ type: 'boolean', default: false })
  estado: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.incidencias, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'user_id' })
  usuario: User;


}
