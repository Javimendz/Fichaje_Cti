
import { User } from "auth/entities/user.entity";
import { Horario } from "schedules/entities/schedules.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";

@Entity('empresas')
export class Empresa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { unique: true })
  nombre: string;

  @Column('text', { nullable: true })
  cif?: string;

  @Column('text', { nullable: true })
  direccion?: string;

  @Column('text', { nullable: true })
  telefono?: string;

  @Column('text', { nullable: true })
  email?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' }) // 👈 Usa este decorador para evitar errores de SQL
  createdAt: Date;

  // Una empresa tiene muchos Usuarios (SuperAdmins, Admins, etc.)
  @OneToMany(() => User, (user) => user.empresa)
  usuarios: User[];

  // Una empresa tiene muchos Horarios (Turnos configurados)
  @OneToMany(() => Horario, (horario) => horario.empresa)
  horarios: Horario[];
}