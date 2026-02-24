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
  inicio: string;

  @Column({ type: 'time', nullable: true })

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