
import { User } from "auth/entities/user.entity";
import { Horario } from "schedule/entities/schedules.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";

@Entity('empresas')
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text', { unique: true })
  nombre: string;

  @Column('text', { nullable: true })
  cif?: string;

  @Column('text', { nullable: true })
  direccion?: string;

  

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

  @CreateDateColumn({ name: 'created_at' }) 
  createdAt: Date;

  // Una empresa tiene muchos Usuarios (SuperAdmins, Admins, etc.)
  @OneToMany(() => User, (user) => user.empresa, { 
    cascade: true, 
    onDelete: 'CASCADE' // Esto le dice a la DB que cree la relación con ON DELETE CASCADE
  })
  usuarios: User[];

  // Una empresa tiene muchos Horarios (Turnos configurados)
  @OneToMany(() => Horario, (horario) => horario.empresa, { 
    cascade: true, 
    onDelete: 'CASCADE' 
  })
  horarios: Horario[];
}