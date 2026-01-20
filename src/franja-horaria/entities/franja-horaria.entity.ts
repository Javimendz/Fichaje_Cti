import { DistribucionDia } from "schedules/entities/distribucion-dia.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('franjas_horarias')
export class FranjaHoraria {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  inicio: string; // Almacena "08:00"

  @Column()
  fin: string;    // Almacena "12:00"

  @ManyToOne(() => DistribucionDia, (dist) => dist.franjas,{ onDelete: 'CASCADE' })
  @JoinColumn({ name: 'distribucionDia_id' })
  distribucionDia: DistribucionDia;
}