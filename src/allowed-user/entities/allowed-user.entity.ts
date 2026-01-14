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

@Entity('allowed_users') // Nombre de tabla en snake_case 
export class AllowedUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============================================
  // IDENTIFICACIÓN (El teléfono es la clave de acceso)
  // ============================================
  @Column({ type: 'text', unique: true, nullable: false })
  telefono: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  dni?: string | null;

  @Column({ type: 'text', nullable: true })
  email?: string | null;

  // ============================================
  // DATOS PERSONALES (Rellenados por Admin)
  // ============================================
  @Column({ type: 'text', nullable: true })
  nombre?: string | null;

  @Column({ type: 'text', nullable: true })
  apellidos?: string | null;

  @Column({ type: 'date', nullable: true })
  fechaNacimiento?: Date | null;

  // ============================================
  // DIRECCIÓN
  // ============================================
  @Column({ type: 'text', nullable: true })
  calle?: string | null;

  @Column({ type: 'text', nullable: true })
  poblacion?: string | null;

  @Column({ type: 'text', nullable: true })
  provincia?: string | null;

  @Column({ type: 'text', nullable: true })
  pais?: string | null;

  // ============================================
  // DATOS LABORALES (Pre-configurados)
  // ============================================
  @Column({ type: 'text', nullable: true })
  categoria?: string | null;

  @Column({ type: 'text', nullable: true })
  actividad?: string | null;

  @Column({ type: 'int', nullable: true })
  diaPertenece?: number | null;

  // ============================================
  // ESTADO DE ACTIVACIÓN
  // ============================================
  @Column({ type: 'text', nullable: true })
  codigoOTP?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  codigoExpiraEn?: Date | null;

  @Column({ type: 'bool', default: false })
  isVerified: boolean; // Indica si el trabajador ya validó su móvil

  @Column({ type: 'bool', default: true })
  isActive: boolean; // El admin puede darlo de baja antes de que empiece

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.WORKER
  })
  rol: UserRole;

  // ============================================
  // RELACIONES
  // ============================================

  @Column({ nullable: false }) // Obligatorio para que pertenezca a una empresa
  empresaId: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresaId' })
  empresa: Empresa;

  @Column({ nullable: true, name: 'horario_id' })
  horarioId?: string | null;

  @ManyToOne(() => Horario, { nullable: true })
  @JoinColumn({ name: 'horario_id' })
  horario?: Horario | null;

  // Nota: Estas relaciones solo funcionarán si estas tablas apuntan a 'allowed_users' 
  // o si decides que esta es tu tabla de usuarios definitiva.
  @OneToMany(() => Jornada, (jornada) => jornada.usuario)
  jornadas: Jornada[];

  @OneToMany(() => Ausencia, (ausencia) => ausencia.usuario)
  ausencias: Ausencia[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}