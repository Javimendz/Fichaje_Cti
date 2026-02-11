// src/auth/entities/user.entity.ts
import { Ausencia } from 'absence/entities/ausencia.entity';
import { UserRole } from 'auth/roles.enum';
import { Company } from 'company/entities/company.entity';
import { Workday } from 'workday/entities/workday.entity';
import { Horario } from 'schedule/entities/schedules.entity';
import { Request } from 'request/entities/request.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';


@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', unique: true, nullable: true })
email: string | null;

  @Column({ type: 'text', nullable: true })
  nombre: string | null;

  @Column({ type: 'text', nullable: true })
  apellidos: string | null;

  @Column({ type: 'text', unique: true, nullable: true })
  dni: string | null;

  @Column({ type: 'text', unique: true })
  telefono: string;

  @Column({ type: 'text', nullable: false, select: false }) // Importante para auth.service
  password: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.WORKER })
  rol: UserRole;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

 

  @Column( { name: 'empresa_id', nullable: true })
  empresaId: number | null;

  
  @ManyToOne(() => Company, (empresa) => empresa.usuarios, { 
    onDelete: 'CASCADE' // Crucial para que la DB elimine al usuario al borrar la empresa
  })
  @JoinColumn({ name: 'empresa_id' })
  empresa?: Company | null; // <-- Añade "| null" aquí para TypeScript

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

  @Column({ 
  name: 'token_expira_en', // Nombre exacto en la tabla SQL
  type: 'timestamp', 
  nullable: true 
})
tokenExpiraEn: Date | null;
}