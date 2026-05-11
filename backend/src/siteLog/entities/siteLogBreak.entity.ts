// src/site-log/entities/siteLogBreak.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { SiteLog } from './siteLog.entity';

@Entity('site_log_breaks')
export class SiteLogBreak {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ type: 'int', nullable: true })
  durationSeconds: number;

  @ManyToOne(() => SiteLog, (log) => log.breaks, { onDelete: 'CASCADE' })
  siteLog: SiteLog;
}