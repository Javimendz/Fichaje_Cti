// src/site/entities/site.entity.ts
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  OneToMany, 
  ManyToOne,
  JoinColumn,
  ManyToMany
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { SiteLog } from '../../siteLog/entities/siteLog.entity';
import { IssueSite } from '../../issue-site/entities/issue-site.entity';
import { Worker } from '../../worker/entities/worker.entity';

@Entity('sites')
@Entity('sites')
export class Site {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  // Coordenadas exactas de la obra
  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude: number;

    @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  longitude: number;

  @Column({ type: 'int', default: 100 }) 
  radiusMeters: number; // Radio permitido para fichar (ej: 100m)

  @Column({ type: 'text' })
  direccion: string; // Ej: "Calle Falsa 123"

 @Column({ type: 'varchar', length: 100, nullable: true })
  poblacion: string;
  @Column({ type: 'text', nullable: true })
  codigoPostal: string; // Ej: "28080" (Mejor texto que número por si hay ceros a la izquierda)

  @Column({ type: 'text', nullable: true })
  provincia: string; // Ej: "Madrid"

  @Column({ type: 'text', default: 'España' })
  pais: string; // Le ponemos un valor por defecto para ahorrar trabajo

  @Column()
  empresaId: number;

  @OneToMany(() => SiteLog, (log) => log.site)
  logs: SiteLog[];

@OneToMany(() => IssueSite, (incident) => incident.site)
  incidents: IssueSite[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
  @ManyToMany(() => Worker, (worker) => worker.sites)
  workers: Worker[];
}