import { DistribucionDia } from "schedules/entities/distribucion-dia.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('franjas_horarias')
export class FranjaHoraria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  inicio: string; // Almacena "08:00"

  @Column()
  fin: string;    // Almacena "12:00"

  @ManyToOne(() => DistribucionDia, (dist) => dist.franjas, { 
  onDelete: 'CASCADE' 
})
  distribucionDia: DistribucionDia;

  @CreateDateColumn({ name: 'created_at', nullable: true }) // Fecha de creación automática
  deletedAt: Date;
}