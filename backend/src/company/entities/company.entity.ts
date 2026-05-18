
import { Attendance } from "../../attendance/entities/attendance.entity";
import { User } from "../../auth/entities/user.entity";
import { Horario } from "../../schedule/entities/schedules.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";
import { Request } from "../../request/entities/request.entity";

@Entity('empresas')
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text', { unique: true })
  nombre: string;

  @Column('text', { nullable: true })
  cif?: string;

  @Column({ 
  type: 'varchar', 
  nullable: false, // 🚩 Cambia esto a true para que Postgres no proteste
  name: 'configPassword' ,
  select: false
})
configPassword?: string;

  @Column('text', { nullable: true })
  direccion?: string;

  @Column('text', { nullable: true })
  codigoPostal?: string;

  @Column('text', { nullable: true })
  provincia?: string;

  @Column('text', { nullable: true })
  poblacion?: string;

  @Column('text', { nullable: true })
  contactoNombre?: string;

  @Column('text', { nullable: true })
  telefonoContacto?: string;

  @Column('text', { nullable: true })
  telefonoEmpresa?: string;
  @Column('text', { nullable: true })
  pais?: string;

  @Column('text', { nullable: true })
  email?: string;

  @Column({ name: 'is_active', default: true }) // Mapeo explícito
  isActive: boolean;

  @Column({ default: 'MD' }) // Por defecto Madrid, o el que prefieras
  codigoRegion: string;

  @Column({ type: 'varchar', default: 'trial' })
  plan: string; // Puede ser 'trial', 'premium', 'expired'

  @Column({ name: 'trial_ends_at', type: 'timestamp', nullable: true })
  trialEndsAt: Date | null;

  @Column({ type: 'float', nullable: false })
  latitud: number;

  @Column({ type: 'float', nullable: false })
  longitud: number;

  @Column({ type: 'float', default: 100 }) // Radio de 100 metros por defecto
  radioPermitido: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
  
  @Column({ name: 'days_archive_issues', type: 'int', default: 5 })
  daysArchiveIssues: number;

  @Column({ name: 'days_archive_requests', type: 'int', default: 15 })
  daysArchiveRequests: number;
  // Una empresa tiene muchos Usuarios (SuperAdmins, Admins, etc.)
  @OneToMany(() => User, (user) => user.empresa, {
    cascade: true,
  })
  usuarios: User[];

  // Una empresa tiene muchos Horarios (Turnos configurados)
  @OneToMany(() => Horario, (horario) => horario.empresa, {
    cascade: true,
    onDelete: 'CASCADE'
  })
  horarios: Horario[];


  @OneToMany(() => Request, (request) => request.empresa)
  solicitudes: Request[];
  @OneToMany(() => Attendance, (attendance) => attendance.empresa)
  asistencias: Attendance[];
}