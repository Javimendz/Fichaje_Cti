// src/allowed-user/entities/allowed-user.entity.ts
import { Ausencia } from "ausencia/entities/ausencia.entity";
import { UserRole } from "auth/roles.enum";
import { Exclude } from "class-transformer";
import { Empresa } from "empresa/entities/empresa.entity";
import { Jornada } from "jornada/entities/jornada.entity";
import { Horario } from "schedule/entities/schedules.entity";
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
  @PrimaryGeneratedColumn()
  id: number;

  // ============================================
  // IDENTIFICACIÓN
  // ============================================
  @Column({ type: 'text', unique: true, nullable: false })
  telefono: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  dni?: string; // Sin "| null" para evitar error TS2769

  @Column({ type: 'text', nullable: true })
  email?: string;

  // ============================================
  // DATOS PERSONALES
  // ============================================
  @Column({ type: 'text', nullable: true })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  apellidos?: string;

  @Column({ type: 'date', nullable: true })
  fechaNacimiento?: Date;

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

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresaId' })
  empresa: Empresa;

  @Column({ nullable: true, name: 'horario_id' })
  horarioId?: number;

@ManyToOne(() => Horario, (horario) => horario.usuarios, { 
  nullable: true, 
  onDelete: 'CASCADE' 
})  @JoinColumn({ name: 'horario_id' })
  horario?: Horario;

  @OneToMany(() => Jornada, (jornada) => jornada.usuario,{cascade:true} )
  jornadas: Jornada[];

  @OneToMany(() => Ausencia, (ausencia) => ausencia.usuario,{cascade: true})
  ausencias: Ausencia[];

  @Exclude()
  @Column()
password: string;
}