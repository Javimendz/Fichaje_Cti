import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToMany, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { AllowedUser } from '../../allowed-user/entities/allowed-user.entity';
import { DistribucionDia } from './distribucion-dia.entity';
import { Empresa } from 'empresas/entities/empresa.entity';

@Entity('horarios')
export class Horario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  nombre: string;

  

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio: Date;

  @Column({ name: 'fecha_fin', type: 'date' })
  fechaFin: Date;

  @Column({ type: 'text' })
  tipo: string; // Ej: 'Oficina', 'Rotativo', 'Verano'

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // RELACIONES
  // ============================================

  // Relación con los días (Lunes, Martes...)
  // cascade: true permite guardar el horario y sus días en una sola operación
  @OneToMany(() => DistribucionDia, (distribucion) => distribucion.horario, { 
    cascade: true,
    eager: true // Carga automáticamente los días al consultar el horario
  })
  distribuciones: DistribucionDia[];

  // Relación con los usuarios asignados a este horario
  @OneToMany(() => AllowedUser, (user) => user.horario)
  usuarios: AllowedUser[];

  // AUDITORÍA
  // ============================================

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;


// Relación con Empresa (N:1)
  @ManyToOne(() => Empresa, (empresa) => empresa.horarios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ name: 'empresa_id' }) // Columna física en la DB
  empresaId: string;



}