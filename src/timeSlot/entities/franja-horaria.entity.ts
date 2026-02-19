import { DistribucionDia } from "../../schedule/entities/distribucion-dia.entity"; 
import { 
  Column, 
  CreateDateColumn, 
  Entity, 
  JoinColumn, 
  ManyToOne, 
  PrimaryGeneratedColumn,
  UpdateDateColumn 
} from "typeorm";
import { IsNotEmpty, Matches } from "class-validator";

@Entity('franjas_horarias')
export class FranjaHoraria {
  @PrimaryGeneratedColumn()
  id: number;

 

  @Column({ type: 'time', nullable: false })
  @IsNotEmpty()
  // Regex para HH:MM (00:00 a 23:59)
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { 
    message: 'La hora de inicio debe tener el formato HH:MM (ej: 08:00)' 
  })
  inicio: string;

  @Column({ type: 'time', nullable: true })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { 
    message: 'La hora de fin debe tener el formato HH:MM (ej: 18:00)' 
  })
  fin?: string | null;

  // --- RELACIONES ---

  @ManyToOne(() => DistribucionDia, (dist) => dist.franjas, { 
    onDelete: 'CASCADE', 
    nullable: false 
  })
  @JoinColumn({ name: 'distribucion_dia_id' }) 
  distribucionDia: DistribucionDia;

  // --- AUDITORÍA ---
  
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  
}