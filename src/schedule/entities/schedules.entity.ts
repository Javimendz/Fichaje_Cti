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

  // --- CONFIGURACIÓN TEMPORAL ---
  @Column({ name: 'fecha_inicio', type: 'date' }) // Fecha de inicio
  fechaInicio: Date; // Fecha de inicio de vigencia del horario

  @Column({ name: 'fecha_fin', type: 'date' }) // Fecha de fin
  fechaFin: Date; // Fecha de fin de vigencia del horario

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

  // 2. Columna Física (AHORA PERMITIMOS ESCRITURA)
  // Quitamos insert:false y update:false para poder asignar el ID manualmente
  @Column({ name: 'empresa_id' }) 
  empresaId: number;

  // Relación con los días (Lunes, Martes...)
  // cascade: true permite guardar el horario y sus días en una sola operación
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