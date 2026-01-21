// src/ausencia/entities/ausencia.entity.ts
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum AusenciaEstado {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA'
}

@Entity('ausencias')
export class Ausencia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tipo: string; 

  // CORRECCIÓN: Añadido name para que coincida con Postgres
  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio: Date;

  @Column({ name: 'fecha_fin', type: 'date' })
  fechaFin: Date;

  @Column({ nullable: true })
  motivo: string;

  @Column({ type: 'enum', enum: AusenciaEstado, default: AusenciaEstado.APROBADA })
  estado: AusenciaEstado;

  @Column({ name: 'usuario_id' })
  usuarioId: string;

  @Column({ name: 'empresa_id' }) 
  empresaId: string;

  @Column({ name: 'dias_consumidos', type: 'int', default: 0 })
  diasConsumidos: number;

  @Column({ name: 'dias_totales', type: 'int', nullable: true })
  diasTotales: number;

  @ManyToOne(() => User, (user) => user.id)
  usuario: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}