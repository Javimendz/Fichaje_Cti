import { Ausencia } from "ausencia/entities/ausencia.entity";
import { UserRole } from "auth/roles.enum";
import { Empresa } from "empresas/entities/empresa.entity";
import { Jornada } from "jornada/entities/jornada.entity";
import { Horario } from "schedules/entities/horario.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class  User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

@Column({ length: 20, nullable: true })
telefono?: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  rol: UserRole;

@Column({ type: 'json', nullable: true })
codigoOTP: {
  codigo: string;
  expiracion: Date;
} | null;

  @Column({ type: 'timestamp', nullable: true })
  codigoExpiraEn?: Date | null;

  @Column({ nullable: true })
  dni?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ default: true })
  isActive: boolean;

   @ManyToOne(() => Empresa, empresa => empresa.usuarios)
   empresa: Empresa;

   @OneToMany(() => Jornada, (jornada) => jornada.usuario)
  jornadas: Jornada[];

  @OneToMany(() => Ausencia, (ausencia) => ausencia.usuario)
  ausencias: Ausencia[];


  @ManyToOne(() => Horario, (horario) => horario.usuarios, { nullable: true })
  @JoinColumn({ name: 'horario_id' }) // Mapeo exacto a tu modelo ER
  horario: Horario;
}