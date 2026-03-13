// src/auth/entities/user.entity.ts
import { Ausencia } from 'absence/entities/ausencia.entity';
import { UserRole } from 'auth/roles.enum';
import { Company } from 'company/entities/company.entity';
import { Workday } from 'workday/entities/workday.entity';
import { Horario } from 'schedule/entities/schedules.entity';
import { Request } from 'request/entities/request.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Activity } from 'activity/entities/activity.entity';


// El User es la entidad principal que representa a los usuarios del sistema. Incluye campos como id, email, nombre, apellidos, dni, telefono, password, rol, isVerified, isActive, empresaId, tokenExpiraEn, createdAt y updatedAt. Además, establece relaciones con otras entidades como Company (empresa), Horario (horario), Workday (jornadas), Ausencia (ausencias) y Request (solicitudes). Esta entidad es fundamental para la gestión de usuarios en el sistema, ya que almacena toda la información relevante sobre los usuarios y sus relaciones con otros módulos del sistema.
/**
 * * * * User Entity
 * * * El User es la entidad principal que representa a los usuarios del sistema. Incluye campos como id, email, nombre, apellidos, dni, telefono, password, rol, isVerified, isActive, empresaId, tokenExpiraEn, createdAt y updatedAt. Además, establece relaciones con otras entidades como Company (empresa), Horario (horario), Workday (jornadas), Ausencia (ausencias) y Request (solicitudes). Esta entidad es fundamental para la gestión de usuarios en el sistema, ya que almacena toda la información relevante sobre los usuarios y sus relaciones con otros módulos del sistema.
 * * * * Campos:
 * * id: Identificador único del usuario (clave primaria).
 * * email: Correo electrónico del usuario, que debe ser único.
 * * nombre: Nombre del usuario.
 * * apellidos: Apellidos del usuario.
 * * telefono: Número de teléfono del usuario, que debe ser único.
 * * * password: Contraseña del usuario, que se almacena de forma segura (no se selecciona por defecto en las consultas).
 * * rol: Rol del usuario (SUPERADMIN, ADMIN, WORKER).
 * * isVerified: Indica si el usuario ha verificado su cuenta.
 * * isActive: Indica si el usuario está activo o ha sido desactivado.
 * * empresaId: Identificador de la empresa a la que pertenece el usuario (puede ser null para SUPERADMIN).
 * * tokenExpiraEn: Fecha y hora de expiración del token JWT del usuario (puede ser null si no se ha generado un token).
 * * createdAt: Fecha y hora de creación del usuario.
 * * * updatedAt: Fecha y hora de la última actualización del usuario.
 * * * Relaciones:
 * * * empresa: Relación ManyToOne con la entidad Company, que representa la empresa a la que pertenece el usuario.
 * * * horario: Relación ManyToOne con la entidad Horario, que representa el horario asignado al usuario (puede ser null).
 * * * * jornadas: Relación OneToMany con la entidad Workday, que representa las jornadas laborales del usuario.
 * * * ausencias: Relación OneToMany con la entidad Ausencia, que representa las ausencias del usuario.
 * * * solicitudes: Relación OneToMany con la entidad Request, que representa las solicitudes realizadas por el usuario.
 * */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', unique: true, nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  nombre: string | null;


  @Column({ name: 'horario_id', nullable: true })
  horarioId: number | null;

  @Column({ type: 'text', nullable: true })
  apellidos: string | null;

  @Column({ type: 'text', unique: true, nullable: true })
  dni: string | null;

  @Column({ type: 'text', unique: true })
  telefono: string;

  @Column({ type: 'text', nullable: false, select: false })
  password: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.WORKER })
  rol: UserRole;

  @Column({ name: 'actividad_id', nullable: true })
  actividadId: number | null;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'fecha_inicio_horario' })
  fechaInicioHorario: Date | null;

  @Column({ name: 'empresa_id', nullable: true }) // 👈 Cambiar a false
  empresaId: number;


  @ManyToOne(() => Company, (empresa) => empresa.usuarios, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'empresa_id' })
  empresa?: Company | null;

  @ManyToOne(() => Horario, (horario) => horario.usuarios, { nullable: true })
  @JoinColumn({ name: 'horario_id' })
  horario: Horario | null;

  @OneToMany(() => Workday, (j) => j.usuario)
  jornadas: Workday[];

  @OneToMany(() => Ausencia, (a) => a.usuario)
  ausencias: Ausencia[];

  @CreateDateColumn()
  createdAt: Date;


  @OneToMany(() => Request, (solicitud) => solicitud.usuario)
  solicitudes: Request[];

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Activity, (activity) => activity.workers, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actividad_id' })
  actividad: Activity | null;

  @Column({
    name: 'token_expira_en', // Nombre exacto en la tabla SQL
    type: 'timestamp',
    nullable: true
  })
  tokenExpiraEn: Date | null;
}