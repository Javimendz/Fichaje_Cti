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

import { Ausencia } from "ausencia/entities/ausencia.entity";
import { UserRole } from "auth/roles.enum";
import { Empresa } from "empresas/entities/empresa.entity";
import { Jornada } from "jornada/entities/jornada.entity";
import { Horario } from "schedules/entities/horario.entity";

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================
  // CONTACTO (OBLIGATORIOS)
  // ============================================
  @Column('text', { unique: true, nullable: false })
  telefono: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  dni: string | null;

  @Column('text', { nullable: true })
  email?: string | null;

  // ============================================
  // DATOS PERSONALES
  // ============================================
  @Column({ type: 'text', nullable: true })
  nombre?: string | null;

  @Column('text', { nullable: true })
  apellidos?: string | null;

  @Column('date', { nullable: true })
  fechaNacimiento?: Date | null;

  // ============================================
  // DIRECCIÓN
  // ============================================
  @Column('text', { nullable: true })
  calle?: string | null;

  @Column('text', { nullable: true })
  poblacion?: string | null;

  @Column('text', { nullable: true })
  provincia?: string | null;

  @Column('text', { nullable: true })
  pais?: string | null;

  // ============================================
  // DATOS LABORALES
  // ============================================
  @Column('text', { nullable: true })
  categoria?: string | null;

  @Column('text', { nullable: true })
  actividad?: string | null;

  @Column('int', { nullable: true })
  diaPertenece?: number | null;

  // ============================================
  // AUTENTICACIÓN
  // ============================================
  @Column({ type: 'text', nullable: true, select: false })
  password?: string | null; 

  @Column({ type: 'text', nullable: true })
  codigoOTP?: string | null; 

  @Column({ type: 'timestamp', nullable: true })
  codigoExpiraEn?: Date | null;

  @Column('bool', { default: false })
  isVerified: boolean;

  @Column('bool', { default: true })
  isActive: boolean;

  // ============================================
  // ROL Y PERMISOS
  // ============================================
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.WORKER
  })
  rol: UserRole;

  // ============================================
  // RELACIONES (CORREGIDAS)
  // ============================================

  // Relación con Empresa
  @Column('uuid', { name: 'empresa_id', nullable: true })
  empresa_id: string | null;

  @ManyToOne(() => Empresa, (empresa) => empresa.usuarios, { 
    nullable: true, 
    onDelete: 'SET NULL' 
  })
  @JoinColumn({ name: 'empresa_id' }) 
  empresa?: Empresa | null;

  // Relación con Horario
  @Column('uuid', { name: 'horario_id', nullable: true })
  horarioId?: string | null;

  @ManyToOne(() => Horario, (horario) => horario.usuarios, { nullable: true })
  @JoinColumn({ name: 'horario_id' })
  horario?: Horario | null;

  // Relaciones Inversas
  @OneToMany(() => Jornada, (jornada) => jornada.usuario)
  jornadas: Jornada[];

  @OneToMany(() => Ausencia, (ausencia) => ausencia.usuario)
  ausencias: Ausencia[];

  // ============================================
  // METADATA
  // ============================================
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}