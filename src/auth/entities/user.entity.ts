import { 
  Column, 
  CreateDateColumn, 
  Entity, 
  JoinColumn, 
  ManyToOne, 
  OneToMany, 
  PrimaryGeneratedColumn 
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

  // --- Información Personal ---
  @Column({ type: 'text', nullable: true })
  nombre: string | null;

  @Column({ type: 'text', nullable: true })
  apellidos: string | null;

  @Column({ type: 'text', unique: true, nullable: true })
  dni: string | null;

  @Column({ type: 'text', unique: true, nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  telefono: string | null;

  @Column({ type: 'text', nullable: true, select: false }) // select: false por seguridad
  password: string | null;

  // --- Estado y Seguridad ---
  @Column({ type: 'enum', enum: UserRole, default: UserRole.WORKER })
  rol: UserRole;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // --- Gestión de OTP (Código de Verificación) ---
  @Column({ type: 'jsonb', nullable: true }) // jsonb es más eficiente en Postgres
  codigoOTP: {
    codigo: string;
    expiracion: Date;
  } | null;

  @Column({ type: 'timestamp', nullable: true })
  codigoExpiraEn: Date | null;

  // --- Relación con Horario ---
  @ManyToOne(() => Horario, (horario) => horario.usuarios, { nullable: true })
  @JoinColumn({ name: 'horario_id' })
  horario: Horario | null;

  // --- Relación con Empresa (Multitenancy) ---
  @ManyToOne(() => Empresa, (empresa) => empresa.usuarios, { 
    nullable: true, 
    onDelete: 'SET NULL' 
  })
  @JoinColumn({ name: 'empresaId' }) 
  empresa: Empresa | null;

  /**
   * empresaId explícito para facilitar filtrado en servicios
   * insert: false, update: false evita el error "DataTypeNotSupportedError"
   */
  @Column({ type: 'uuid', nullable: true, insert: false, update: false })
  empresaId: string | null;

  // --- Relaciones Inversas (Arrays) ---
  @OneToMany(() => Jornada, (jornada) => jornada.usuario)
  jornadas: Jornada[];

  @OneToMany(() => Ausencia, (ausencia) => ausencia.usuario)
  ausencias: Ausencia[];

  // --- Auditoría ---
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}