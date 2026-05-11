// src/site/entities/site-incident.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Site } from '../../site/entities/site.entity';
import { IncidentSeverity, IncidentType } from '../../site/enums/issue-type.enum';

@Entity('site_incidents')
export class IssueSite {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Site, (site) => site.incidents)
  site: Site;

  @ManyToOne(() => User)
  user: User; // Quién reporta la incidencia

  @Column({ type: 'text', nullable: true })
  resolutionNote: string;

  @ManyToOne(() => User, { nullable: true })
  resolvedBy: User;

  @Column({ type: 'timestamp', nullable: true })
  assignedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  assignedTo: User;

  @Column({
    type: 'enum',
    enum: IncidentType,
    default: IncidentType.OTHER,
  })
  type: IncidentType;

  @Column({
    type: 'enum',
    enum: IncidentSeverity,
    default: IncidentSeverity.LOW,
  })
  severity: IncidentSeverity;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', nullable: true })
  evidenceUrl: string; // Link a foto de la incidencia (S3/Cloudinary)

  @Column({ type: 'boolean', default: false })
  isResolved: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;
}