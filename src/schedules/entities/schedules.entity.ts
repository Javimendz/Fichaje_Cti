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
import { AllowedUser } from '../../allowed-user/entities/allowed-user.entity';
import { DistribucionDia } from './distribucion-dia.entity';
import { Empresa } from 'empresa/entities/empresa.entity';

/**
 * Horario Entity
 * Representa un horario dentro del sistema.
 * Contiene información sobre el nombre, tipo,
 * fechas de vigencia, estado y relaciones con la empresa,
 * los días de distribución y los usuarios asignados.
 * Define las columnas de la tabla 'horarios' en la base de datos.
 * @entity 'horarios' define el nombre de la tabla en la base de datos.
 * @see Empresa para la relación con la empresa a la que pertenece el horario.
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
  @ManyToOne(() => Empresa, (empresa) => empresa.horarios, { onDelete: 'CASCADE' }) // Si se elimina la empresa, se eliminan sus horarios
  @JoinColumn({ name: 'empresa_id' }) // Columna de unión personalizada
  empresa: Empresa; // Empresa a la que pertenece el horario

  @Column({ name: 'empresa_id' }) // Columna física en la DB
  empresaId: number; //

  // Relación con los días (Lunes, Martes...)
  // cascade: true permite guardar el horario y sus días en una sola operación
@OneToMany(() => DistribucionDia, (dist) => dist.horario, { 
  cascade: true 
})
  distribuciones: DistribucionDia[]; // Días de distribución del horario

  // Relación con los usuarios asignados a este horario
  @OneToMany(() => AllowedUser, (user) => user.horario)
  usuarios: AllowedUser[]; // Usuarios asignados a este horario

  // --- AUDITORÍA ---
  // ============================================

  @CreateDateColumn({ name: 'created_at' }) // Fecha de creación automática
  createdAt: Date; // Fecha en que se creó el registro

  @UpdateDateColumn({ name: 'updated_at' }) // Fecha de última actualización automática
  updatedAt: Date; // Fecha de la última actualización del registro

  @CreateDateColumn({ name: 'deleted_at', nullable: true }) // Fecha de eliminación automática
  deletedAt: Date;
}