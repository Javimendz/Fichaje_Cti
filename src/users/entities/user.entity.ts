// src/auth/entities/user.entity.ts
import { Ausencia } from 'ausencia/entities/ausencia.entity';
import { UserRole } from 'auth/roles.enum';
import { Empresa } from 'empresa/entities/empresa.entity';
import { Jornada } from 'jornada/entities/jornada.entity';
import { Horario } from 'schedule/entities/schedules.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';


/**
 * User Entity
 *  Representa a un usuario en el sistema con sus propiedades y relaciones.
 * Contiene información personal, credenciales de seguridad, estado de la cuenta,
 * y relaciones con otras entidades como Empresa, Horario, Jornadas y Ausencias.
 * Define las columnas de la tabla 'users' en la base de datos.
 * 
 * @entity 'users' define el nombre de la tabla en la base de datos.
 * @see Empresa para la relación con la empresa a la que pertenece el usuario.
 * @see Horario para la relación con el horario asignado al usuario.
 * @see Jornada para la relación con las jornadas laborales del usuario.  
 * @see Ausencia para la relación con las ausencias del usuario.
 * @role UserRole define los posibles roles que un usuario puede tener en el sistema.
 * @metadata createdAt y updatedAt para auditoría de registros.
 *  
 */
@Entity('users') // Nombre de la tabla en la base de datos
export class User { // Definición de la entidad User
  // --- IDENTIFICADOR ---
  @PrimaryGeneratedColumn() // ID único generado automáticamente
  id: number; // Identificador único del usuario

  // --- DATOS PERSONALES ---
  @Column({ type: 'text', unique: true, nullable: true }) // Email único, puede ser nulo
  email: string | null; // Correo electrónico del usuario

  @Column({ type: 'text', nullable: true }) // Nombre puede ser nulo
  nombre: string | null; // Nombre del usuario

  @Column({ type: 'text', nullable: true }) // Apellidos pueden ser nulos
  apellidos: string | null; // Apellidos del usuario

  @Column({ type: 'text', unique: true, nullable: true }) // DNI único, puede ser nulo
  dni: string | null; // Documento Nacional de Identidad

  @Column({ type: 'text', unique: true }) // Teléfono único
  telefono: string; // Número de teléfono del usuario

  // --- SEGURIDAD Y ESTADO ---
@Column({ 
  type: 'text', 
  nullable: false, // La base de datos no permitirá nulos
  select: false    // Seguridad: No se envía en los GET
})  password: string | null; // Contraseña del usuario (hashed)

  @Column({ type: 'enum', enum: UserRole, default: UserRole.WORKER }) // Rol del usuario con valor por defecto WORKER
  rol: UserRole; // Rol del usuario en el sistema

  @Column({ type: 'boolean', default: false }) // Verificación por defecto es false
  isVerified: boolean; // Indica si el usuario ha verificado su cuenta

  @Column({ type: 'boolean', default: true }) // Cuenta activa por defecto
  isActive: boolean; // Indica si la cuenta del usuario está activa

  
  @Column({  // Fecha de expiración del token de restablecimiento de contraseña
    name: 'token_expira_en',  // Nombre personalizado de la columna
    type: 'timestamp',  // Tipo de dato timestamp
    nullable: true  // Permite valores nulos
  })
  tokenExpiraEn: Date | null; // Fecha de expiración del token de restablecimiento de contraseña

  // --- RELACIONES: EMPRESA ---
  @Column( { name: 'empresa_id', nullable: true }) // Columna física en la DB
  empresaId: number | null; // ID de la empresa a la que pertenece el usuario

  @ManyToOne(() => Empresa, (empresa) => empresa.usuarios, { nullable: true, onDelete: 'SET NULL' }) // Relación con Empresa
  @JoinColumn({ name: 'empresa_id' }) // Llave foránea personalizada
  empresa: Empresa | null; // Empresa a la que pertenece el usuario

  // --- RELACIONES: PLANIFICACIÓN Y REGISTROS ---
  @ManyToOne(() => Horario, (horario) => horario.usuarios, { nullable: true }) // Relación con Horario
  @JoinColumn({ name: 'horario_id' }) // Llave foránea personalizada
  horario: Horario | null; // Horario asignado al usuario

  @OneToMany(() => Jornada, (j) => j.usuario) // Relación con Jornadas
  jornadas: Jornada[]; // Jornadas laborales del usuario

  @OneToMany(() => Ausencia, (a) => a.usuario) // Relación con Ausencias
  ausencias: Ausencia[]; // Ausencias del usuario

  // --- METADATOS / AUDITORÍA ---
  @CreateDateColumn() // Fecha de creación automática
  createdAt: Date; // Fecha de creación del registro

  @UpdateDateColumn() // Fecha de actualización automática
  updatedAt: Date; // Fecha de la última actualización del registro

  
}