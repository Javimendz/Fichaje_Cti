import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToMany, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne,
  JoinColumn,
  DeleteDateColumn
} from 'typeorm';
import { Worker } from '../../worker/entities/worker.entity';
import { DistribucionDia } from './distribucion-dia.entity';
import { Company } from 'company/entities/company.entity';

/**
 * Horario Entity
 * Representa un horario dentro del sistema.
 * Contiene información sobre el nombre, tipo,
 * fechas de vigencia, estado y relaciones con la empresa,
 * los días de distribución y los usuarios asignados.
 * Define las columnas de la tabla 'horarios' en la base de datos.
 * @entity 'horarios' define el nombre de la tabla en la base de datos.
 * @see Company para la relación con la empresa a la que pertenece el horario.
 * @see DistribucionDia para la relación con los días de distribución del horario.
 * @see AllowedUser para la relación con los usuarios asignados a este horario.
 * @metadata createdAt y updatedAt para auditoría de registros.
 *  
 */
@Entity('horarios') // Nombre de la tabla en la base de datos
export class Horario {
  // --- IDENTIFICADOR ---
  @PrimaryGeneratedColumn()
  id: number;

  // --- INFORMACIÓN GENERAL ---
  @Column({ type: 'text' })
  nombre: string;

  @Column({ type: 'text' })
  tipo: string; // Ej: 'Oficina', 'Rotativo', 'Verano'

  @Column({ type: 'boolean', default: true }) // Horario activo por defecto
  isActive: boolean; // Indica si el horario está activo

  @Column({ type: 'boolean', default: false })
  esRotativo: boolean;

  @Column({ type: 'int', default: 1 })
  semanasRotacion: number;

  

  // --- RELACIONES ---
  // ============================================

  // Relación con Empresa (N:1)
  // 1. RELACIÓN PRINCIPAL (Encargada de las escrituras/joins)
@ManyToOne(() => Company, (empresa) => empresa.horarios, { 
    onDelete: 'CASCADE',
    nullable: false 
  })
  @JoinColumn({ name: 'empresa_id' }) // Vincula con la columna física
  empresa: Company;

  // 2. Columna Física 
  @Column({ name: 'empresa_id' }) 
  empresaId: number;

  // Relación con los días (Lunes, Martes...)
@OneToMany(() => DistribucionDia, (dist) => dist.horario, { 
  cascade: true,
    eager: true

})
  distribuciones: DistribucionDia[]; // Días de distribución del horario

  // Relación con los usuarios asignados a este horario
  @OneToMany(() => Worker, (user) => user.horario)
  usuarios: Worker[]; // Usuarios asignados a este horario

  // --- AUDITORÍA ---
  // ============================================

  @CreateDateColumn({ name: 'created_at' }) // Fecha de creación automática
  createdAt: Date; // Fecha en que se creó el registro

  @UpdateDateColumn({ name: 'updated_at' }) // Fecha de última actualización automática
  updatedAt: Date; // Fecha de la última actualización del registro

@DeleteDateColumn({ name: 'deleted_at', nullable: true })  deletedAt: Date;
}