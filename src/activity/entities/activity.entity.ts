import { TipoPuesto } from 'activity/dto/tipo-puesto.enum';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from 'users/entities/user.entity';

@Entity('actividades')
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  //  El tipo de puesto predefinido de la fábrica
  @Column({ type: 'enum', enum: TipoPuesto, default: TipoPuesto.OTRO })
  tipo: TipoPuesto;

  // Opcional: Un nombre más específico si lo desean (Ej: "Operario de la Máquina 3")
  @Column({ type: 'varchar', length: 100 })
  nombre: string; 

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  //  Fecha en la que se crea o entra en vigor este puesto
  @Column({ type: 'date' })
  fecha: Date;

  @Column({ name: 'empresa_id' })
  empresaId: number;

  @Column({ default: true })
  activa: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => User, (user) => user.actividad)
  usuarios: User[];
}