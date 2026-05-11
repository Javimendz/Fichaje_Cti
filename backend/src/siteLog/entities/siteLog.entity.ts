// src/site-log/entities/siteLog.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity'; // Ajusta la ruta
import { Site } from '../../site/entities/site.entity';   // Ajusta la ruta
import { SiteLogBreak } from './siteLogBreak.entity';

@Entity('site_logs')
export class SiteLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Site, (site) => site.logs, {
  onDelete: 'CASCADE' // 🚩 AÑADE ESTA LÍNEA
})
@JoinColumn({ name: 'site_id' })
site: Site;

  @ManyToOne(() => User)
  user: User;

  @Column({ type: 'timestamp' })
  checkIn: Date;

  @Column({ type: 'timestamp', nullable: true })
  checkOut: Date;

  // --- DATOS DE ENTRADA (Ya los tenías) ---
  @Column({ type: 'float' })
  latitudeIn: number;

  @Column({ type: 'float' })
  longitudeIn: number;

  @Column({ default: true })
  isInsideIn: boolean;

  // --- 🚩 NUEVOS CAMPOS DE SALIDA (Añade estos) ---
  @Column({ type: 'float', nullable: true })
  latitudeOut: number;

  @Column({ type: 'float', nullable: true })
  longitudeOut: number;

  @Column({ default: false })
  isInsideOut: boolean;

  // --- OTROS DATOS ---
  @Column({ nullable: true })
  notes?: string;

  @Column({ type: 'int', nullable: true })
  totalSeconds: number;

  @Column({ default: false })
  wasAutoClosed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: false })
  isManual: boolean;

  @Column({ nullable: true })
  editedByAdminId: number;

  @CreateDateColumn({ 
    name: 'serverReceivedAt', 
    type: 'timestamp',
    comment: 'Fecha y hora exacta en la que el servidor procesó el fichaje' 
  })
  serverReceivedAt: Date;

  @OneToMany(() => SiteLogBreak, (siteBreak) => siteBreak.siteLog)
  breaks: SiteLogBreak[];
}