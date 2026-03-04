import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from 'users/entities/user.entity';

export enum IncidenciaTipo {
  NO_ASISTENCIA = 'NO_ASISTENCIA',
  TARDANZA = 'TARDANZA',
  SALIDA_ANTICIPADA = 'SALIDA_ANTICIPADA',
  FALTA_JORNADA = 'FALTA_JORNADA',
  MARCA_IRREGULAR = 'MARCA_IRREGULAR',
  INCUMPLIMIENTO_NORMAS = 'INCUMPLIMIENTO_NORMAS',
  OTRO = 'OTROS',
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
