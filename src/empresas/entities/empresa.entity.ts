import { User } from "auth/entities/user.entity";
import { Horario } from "schedules/entities/horario.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

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

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;          
    
@OneToMany(() => User, (user) => user.empresa) // Ahora 'user' será reconocido
  usuarios: User[];
  
  @OneToMany(() => Horario, (h) => h.empresa)
  horarios: Horario[];

}