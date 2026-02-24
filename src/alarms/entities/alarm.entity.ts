import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from 'users/entities/user.entity';
import { Company } from 'company/entities/company.entity';

export enum AlarmType {
  ABSENCE = 'AUSENCIA_DETECTADA',
  LATE_ARRIVAL = 'RETRASO',
  UNAUTHORIZED_ZONE = 'ZONA_NO_AUTORIZADA'
}

@Entity('alarms')
export class Alarm {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: AlarmType })
  tipo: AlarmType;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ default: false })
  revisada: boolean;

  @Column({ name: 'empresa_id' })
  empresaId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, {onDelete: 'CASCADE', 
    nullable: false})
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  @ManyToOne(() => Company, {onDelete: 'CASCADE'})
  @JoinColumn({ name: 'empresa_id' })
  empresa: Company;
}