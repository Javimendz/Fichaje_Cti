// src/ausencia/entities/ausencia.entity.ts
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum AusenciaEstado {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA'
}

@Entity('ausencias')
export class Ausencia {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tipo: string; 

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio: Date;

  @Column({ name: 'fecha_fin', type: 'date' })
  fechaFin: Date;

  @Column({ nullable: true })
  motivo: string;

  @Column({ type: 'enum', enum: AusenciaEstado, default: AusenciaEstado.APROBADA })
  estado: AusenciaEstado;

  @Column({ name: 'usuario_id' })
  usuarioId: number;

  @Column({ name: 'empresa_id' }) 
  empresaId: number;

  @Column({ name: 'dias_consumidos', type: 'int', default: 0 })
  diasConsumidos: number;

  @Column({ name: 'dias_totales', type: 'int', nullable: true })
  diasTotales: number;

  @ManyToOne(() => User, (user) => user.ausencias, { 
  nullable: false, 
  onDelete: 'CASCADE' 
})
@JoinColumn({ name: 'usuario_id' })
usuario: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}