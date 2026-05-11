import {
  Entity, Column, PrimaryColumn, OneToOne, ManyToOne, OneToMany,
  JoinColumn, CreateDateColumn, UpdateDateColumn, Index,
  ManyToMany,
  JoinTable
} from "typeorm";
import { Exclude } from "class-transformer";

// Relaciones
import { Company } from "../../company/entities/company.entity";
import { User } from "../../users/entities/user.entity";
import { Horario } from "../../schedule/entities/schedules.entity";
import { Workday } from "../../workday/entities/workday.entity";
import { Ausencia } from "../../absence/entities/ausencia.entity";
import { UserRole } from "../../auth/roles.enum";
import { Activity } from "../../activity/entities/activity.entity";
import { Site } from "../../site/entities/site.entity";

@Entity('workers')
export class Worker {
  [x: string]: any;

  // Usamos PrimaryColumn porque el ID viene heredado de la tabla User
  @PrimaryColumn()
  id: number;

  // ============================================
  // IDENTIFICACIÓN
  // ============================================
  @Index({ unique: true }) // Añadir índices mejora la velocidad de validación
  @Column({ type: 'varchar', length: 20, unique: true, nullable: false })
  telefono: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  dni: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 150, unique: true, nullable: true })
  email: string | null;


  @Column({ nullable: true, name: 'site_id' })
  siteId?: number; // Este es el campo físico en la tabla


  @Column({ 
    type: 'timestamp', 
    nullable: true, 
    default: () => 'CURRENT_TIMESTAMP' // 👈 Añade esto
})
  fechaInicioHorario: Date | null;


  // ============================================
  // DATOS PERSONALES
  // ============================================
  @Column({ type: 'varchar', length: 100, nullable: true })
  nombre: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  apellidos?: string;

  @Column({ type: 'date', nullable: true })
  fechaNacimiento: Date | null;

  // ============================================
  // DIRECCIÓN
  // ============================================
  @Column({ type: 'text', nullable: true })
  calle?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  poblacion?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  provincia?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, default: 'España' })
  pais?: string;

  // ============================================
  // DATOS LABORALES
  // ============================================
  @Column({ type: 'varchar', length: 100, nullable: true })
  categoria?: string;



  @Column({ type: 'int', nullable: true })
  diaPertenece?: number;

  // ============================================
  // ESTADO Y ROLES
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

  @Column({ nullable: false, name: 'empresaId' })
  empresaId: number;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresaId' })
  empresa: Company;

  @Column({ nullable: true, name: 'horario_id' })
  horarioId?: number;

  @ManyToOne(() => Horario, (horario) => horario.usuarios, {
    nullable: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'horario_id' })
  horario?: Horario;


  @Column({ nullable: true, name: 'actividad_id' })
  actividadId?: number;

  @OneToMany(() => Workday, (jornada) => jornada.usuario, { cascade: true })
  jornadas: Workday[];

  @OneToMany(() => Ausencia, (ausencia) => ausencia.usuario, { cascade: true })
  ausencias: Ausencia[];

  @Exclude() // Protege la contraseña en las respuestas JSON
  @Column({ select: false }) // Ni siquiera se trae de la DB a menos que se pida
  password: string;

  // Relación 1:1 con User (El ID de Worker ES el ID de User)
  @OneToOne(() => User, (user) => user.worker, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id' })
  user: User;

  @ManyToOne(() => Activity, (activity) => activity.workers, {
    nullable: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'actividad_id' })
  actividad: Activity;


  @ManyToMany(() => Site, (site) => site.workers) // 🚩 Este 'site.workers' ahora ya existe
@JoinTable({
  name: 'worker_sites',
  joinColumn: { name: 'worker_id', referencedColumnName: 'id' },
  inverseJoinColumn: { name: 'site_id', referencedColumnName: 'id' }
})
sites: Site[];

  // ============================================
  // AUDITORÍA
  // ============================================
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}