import { Ausencia } from "ausencia/entities/ausencia.entity";
import { UserRole } from "auth/roles.enum";
import { IsBoolean, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { Empresa } from "empresas/entities/empresa.entity";
import { Jornada } from "jornada/entities/jornada.entity";
import { Horario } from "schedules/entities/horario.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

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
dni?: string;

@Column('text', { nullable: true })
email?: string;

  // ============================================
  // DATOS PERSONALES
  // ============================================
 @Column({ nullable: true }) // Añade esto
nombre?: string;

  @Column('text', { nullable: true })
  apellidos?: string;

  @Column('date', { nullable: true })
  fechaNacimiento?: Date;

  // ============================================
  // DIRECCIÓN
  // ============================================
  @Column('text', { nullable: true })
  calle?: string;

  @Column('text', { nullable: true })
  poblacion?: string;

  @Column('text', { nullable: true })
  provincia?: string;

  @Column('text', { nullable: true })
  pais?: string;

  // ============================================
  // DATOS LABORALES
  // ============================================
  @Column('text', { nullable: true })
  categoria?: string;

  @Column('text', { nullable: true })
  actividad?: string;

  @Column('int', { nullable: true })
  diaPertenece?: number;

  // ============================================
  // AUTENTICACIÓN
  // ============================================
  @Column({ nullable: true })
  password?: string; // Solo para ADMIN

  @Column({ nullable: true })
  codigoOTP?: string; // Código temporal para WORKER

  @Column({ type: 'timestamp', nullable: true })
  codigoExpiraEn?: Date | null;

  @Column('bool', { default: false })
  isVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  // ============================================
  // ROL Y PERMISOS
  // ============================================
  @Column({
    type: 'enum',
    enum: UserRole,
  })
  rol: UserRole;

  // ============================================
  // RELACIONES
  // ============================================
  @ManyToOne(() => Empresa, (e) => e.usuarios)
  empresa: Empresa;

 @ManyToOne(() => Horario)
  @JoinColumn({ name: 'horario_id' })
  horario: Horario;

  @OneToMany(() => Jornada, (jornada) => jornada.usuario)
  jornadas: Jornada[];

  @OneToMany(() => Ausencia, (ausencia) => ausencia.usuario)
  ausencias: Ausencia[];
}