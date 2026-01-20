import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Horario } from "./horario.entity";
import { FranjaHoraria } from "franja-horaria/entities/franja-horaria.entity";

@Entity()   
export class DistribucionDia {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  diaSemana: string; 

  @Column('float')
  horasDia: number;

  // 1. Quitamos el cascade de aquí. 
  // El cascade debe ir en el @OneToMany de la entidad Horario.
  @ManyToOne(() => Horario, (horario) => horario.distribuciones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'horario_id' })
  horario: Horario;

  // 2. Este sí está perfecto. Permite que al guardar el día se guarden sus franjas.
  @OneToMany(() => FranjaHoraria, (franja) => franja.distribucionDia, { 
    cascade: true, 
    onDelete: 'CASCADE'
  })
  franjas: FranjaHoraria[];

  @Column({ name: 'horario_id' })
  horarioId: string;
}