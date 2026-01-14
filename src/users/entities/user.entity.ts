import { Ausencia } from "ausencia/entities/ausencia.entity";
import { UserRole } from "auth/roles.enum";
import { Empresa } from "empresas/entities/empresa.entity";
import { Jornada } from "jornada/entities/jornada.entity";
import { Horario } from "schedules/entities/horario.entity";
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

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================
  // CONTACTO (OBLIGATORIOS)
  // ============================================
  @Column('text', { unique: true, nullable: false })
  telefono: string;

  @Column({ type: 'varchar', nullable: true })
  dni?: string | null;

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
  // RELACIONES
  // ============================================

  // 1. Añadimos la columna física para evitar el error de "Overload"
  @Column({ nullable: true })
  empresaId: string | null;

  @ManyToOne(() => Empresa, (e) => e.usuarios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresaId' }) // Vincula la relación a la columna empresaId
  empresa: Empresa;

  @Column({ nullable: true, name: 'horario_id' })
  horarioId?: string | null;

  @ManyToOne(() => Horario, { nullable: true })
  @JoinColumn({ name: 'horario_id' })
  horario?: Horario | null;

  @OneToMany(() => Jornada, (jornada) => jornada.usuario)
  jornadas: Jornada[];

  @OneToMany(() => Ausencia, (ausencia) => ausencia.usuario)
  ausencias: Ausencia[];

  // ============================================
  // METADATA
  // ============================================
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}