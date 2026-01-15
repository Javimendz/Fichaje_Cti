// src/auth/entities/user.entity.ts
import { Ausencia } from 'ausencia/entities/ausencia.entity';
import { UserRole } from 'auth/roles.enum';
import { Empresa } from 'empresas/entities/empresa.entity';
import { Jornada } from 'jornada/entities/jornada.entity';
import { Horario } from 'schedules/entities/horario.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';


@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ type: 'text', nullable: true, select: false }) // Importante para auth.service
  password: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.WORKER })
  rol: UserRole;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  codigoOTP: { codigo: string; expiracion: Date } | null;

  @Column({ type: 'timestamp', nullable: true })
  codigoExpiraEn: Date | null;

  @Column('uuid', { name: 'empresa_id', nullable: true })
  empresaId: string | null;

  @ManyToOne(() => Empresa, (empresa) => empresa.usuarios, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa | null;

  @ManyToOne(() => Horario, (horario) => horario.usuarios, { nullable: true })
  @JoinColumn({ name: 'horario_id' })
  horario: Horario | null;

  @OneToMany(() => Jornada, (j) => j.usuario)
  jornadas: Jornada[];

  @OneToMany(() => Ausencia, (a) => a.usuario)
  ausencias: Ausencia[];

  @CreateDateColumn()
  createdAt: Date;



  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ 
  name: 'token_expira_en', // Nombre exacto en la tabla SQL
  type: 'timestamp', 
  nullable: true 
})
tokenExpiraEn: Date | null;
}