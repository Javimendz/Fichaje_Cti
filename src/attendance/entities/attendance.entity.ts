import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('attendances')
export class Attendance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', name: 'usuario_id' })
  usuarioId: number;

  @CreateDateColumn({ type: 'timestamp' })
  fecha: Date;

  @Column({ type: 'boolean', default: false })
  presente: boolean;

  @Column({ type: 'text', nullable: true })
  motivo: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;
}