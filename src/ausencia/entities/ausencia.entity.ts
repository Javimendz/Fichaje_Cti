import { User } from 'auth/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

export enum AusenciaEstado {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
}

@Entity('ausencias')
export class Ausencia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tipo: string; // Ejemplo: 'Vacaciones', 'Enfermedad', 'Asuntos Propios'

  @Column({ type: 'date' })
  fecha_inicio: Date;

  @Column({ type: 'date' })
  fecha_fin: Date;

  @Column({ type: 'int' })
  dias_totales: number;

  @Column({ type: 'int', default: 0 })
  dias_consumidos: number;

  @Column({
    type: 'enum',
    enum: AusenciaEstado,
    default: AusenciaEstado.PENDIENTE,
  })
  estado: AusenciaEstado;

  @Column({ type: 'text', nullable: true })
  motivo: string;

  @ManyToOne(() => User, (u) => u.ausencias)
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;
}