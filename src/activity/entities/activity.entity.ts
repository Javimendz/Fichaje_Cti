import { TipoPuesto } from 'activity/dto/tipo-puesto.enum';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Worker } from 'worker/entities/worker.entity';

@Entity('actividades')
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   *  El tipo de puesto predefinido de la fábrica
   * Puede ser OTRO, OPERADOR, MECANICO, ELECTRONICO, etc.
   * 
   */
  @Column({ type: 'enum', enum: TipoPuesto, default: TipoPuesto.OTROS })
  tipo: TipoPuesto;

  // Opcional: Un nombre más específico si lo desean (Ej: "Operario de la Máquina 3")
  /**
   *  Opcional: Un nombre más específico si lo desean (Ej: "Operario de la Máquina 3")
   * 
   */
  @Column({ type: 'varchar', length: 100 })
  nombre: string; 


  
  /**
   *  Opcional: Descripción detallada del puesto (Ej: "Opera la máquina 3 y 4")
   * 
   */
  @Column({ type: 'text', nullable: true })
  descripcion: string;

  //  Fecha en la que se crea o entra en vigor este puesto
  /**
   *  Fecha en la que se crea o entra en vigor este puesto
   * 
   */ 
  @Column({ type: 'date' })
  fecha: Date;

  /**
   *  ID de la empresa a la que pertenece este puesto
   * 
   */
  @Column({ name: 'empresa_id' })
  empresaId: number;

  /**
   *  Indica si este puesto está activo o no
   * 
   */
  @Column({ default: true })
  activa: boolean;

  /**
   *  Fecha en la que se desactiva este puesto (si está desactivado)
   * 
   */

  @OneToMany(() => Worker, (worker) => worker.actividad)
  workers: Worker[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   *  Fecha en la que se actualiza este puesto
   * 
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
  /**
   *  Relación con la entidad User, indicando los usuarios que tienen este puesto
   * 
   */

  
}