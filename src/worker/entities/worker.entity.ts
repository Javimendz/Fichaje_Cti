// src/allowed-user/entities/allowed-user.entity.ts
import { Ausencia } from "ausencia/entities/ausencia.entity";
import { UserRole } from "auth/roles.enum";
import { Exclude } from "class-transformer";
import { Company } from "company/entities/company.entity";
import { Workday } from "workday/entities/workday.entity";
import { Horario } from "schedule/entities/schedules.entity";
import { User } from 'users/entities/user.entity';
import { OneToOne, PrimaryColumn } from 'typeorm';
import { 
  Column, 
  Entity, 
  JoinColumn, 
  ManyToOne, 
  OneToMany, 
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn 
} from "typeorm";

@Entity('workers')
export class Worker {
  
  @PrimaryColumn()
  id: number;

  // ============================================
  // IDENTIFICACIÓN
  // ============================================
  @Column({ type: 'text', unique: true, nullable: false })
  telefono: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  dni: string | null; // Sin "| null" para evitar error TS2769

  @Column({ type: 'text', nullable: true })
email: string | null;

  // ============================================
  // DATOS PERSONALES
  // ============================================
  @Column({ type: 'text', nullable: true })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  apellidos?: string;

  @Column({ type: 'date', nullable: true })
  fechaNacimiento: Date | null;

  // ============================================
  // DIRECCIÓN
  // ============================================
  @Column({ type: 'text', nullable: true })
  calle?: string;

  @Column({ type: 'text', nullable: true })
  poblacion?: string;

  @Column({ type: 'text', nullable: true })
  provincia?: string;

  @Column({ type: 'text', nullable: true })
  pais?: string;

  // ============================================
  // DATOS LABORALES
  // ============================================
  @Column({ type: 'text', nullable: true })
  categoria?: string;

  @Column({ type: 'text', nullable: true })
  actividad?: string;

  @Column({ type: 'int', nullable: true })
  diaPertenece?: number;

@CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ============================================
  // ESTADO DE ACTIVACIÓN
  // ============================================
  

  

  @Column({ type: 'bool', default: false })
  isVerified: boolean;

  @Column({ type: 'bool', default: true })
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.WORKER
  })
  rol: UserRole;

  // ============================================
  // RELACIONES
  // ============================================

  @Column({ nullable: false })
  empresaId: number;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresaId' })
  empresa: Company;

  @Column({ nullable: true, name: 'horario_id' })
  horarioId?: number;

@ManyToOne(() => Horario, (horario) => horario.usuarios, { 
  nullable: true, 
  onDelete: 'SET NULL' 
})  @JoinColumn({ name: 'horario_id' })
  horario?: Horario;

  @OneToMany(() => Workday, (jornada) => jornada.usuario,{cascade:true} )
  jornadas: Workday[];

  @OneToMany(() => Ausencia, (ausencia) => ausencia.usuario,{cascade: true})
  ausencias: Ausencia[];

  @Exclude()
  @Column()
password: string;


@OneToOne(() => User, (user) => user.worker, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'id' }) // El ID de Worker es el mismo que el de User
user: User;
}