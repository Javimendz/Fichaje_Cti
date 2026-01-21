import { User } from 'auth/entities/user.entity';
import { Empresa } from 'empresas/entities/empresa.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { RevisionSolicitud } from './revision-solicitud.entity';


export enum SolicitudStatus {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
}

export enum TipoSolicitud {
  VACACIONES = 'VACACIONES',
  ENFERMEDAD = 'ENFERMEDAD',
  PERMISO = 'PERMISO',
  ASUNTOS_PROPIOS = 'ASUNTOS_PROPIOS',
}

@Entity('solicitudes')
export class Solicitud {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TipoSolicitud })
  tipo: TipoSolicitud;

  @Column({ type: 'date' })
  fechaInicio: Date;

  @Column({ type: 'date' })
  fechaFin: Date;

  @Column({ type: 'text', nullable: true })
  motivo: string;

  @Column({ type: 'enum', enum: SolicitudStatus, default: SolicitudStatus.PENDIENTE })
  estado: SolicitudStatus;

  @CreateDateColumn()
  fechaSolicitud: Date;

  // Relaciones
  @ManyToOne(() => User, (user) => user.solicitudes)
  usuario: User;

  @Column()
  usuarioId: string;

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @Column({ name: 'empresa_id' })
  empresaId: string;

  @OneToOne(() => RevisionSolicitud, (revision) => revision.solicitud)
  revision: RevisionSolicitud;
  @CreateDateColumn()
  createdAt: Date;
}