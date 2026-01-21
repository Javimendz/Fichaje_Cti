import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Solicitud } from './solicitud.entity';
import { User } from 'auth/entities/user.entity';
 // Ajusta la ruta a tu entidad User

@Entity('revisiones_solicitudes')
export class RevisionSolicitud {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relación 1:1 con la Solicitud
  @OneToOne(() => Solicitud, (solicitud) => solicitud.revision, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'solicitud_id' })
  solicitud: Solicitud;

  @Column({ name: 'solicitud_id' })
  solicitudId: string;

  // Quién tomó la decisión
  @ManyToOne(() => User)
@JoinColumn({ name: 'revisado_por_id' })
admin: User;

  @Column({ name: 'revisado_por_id' }) // Este debe coincidir EXACTAMENTE con el error de la BD
adminId: string;

  @Column({ type: 'text', nullable: true })
  comentarioAdmin: string;

  @CreateDateColumn()
  fechaDecision: Date;

  
}