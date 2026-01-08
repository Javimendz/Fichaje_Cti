import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Horario } from "./horario.entity";
import { FranjaHoraria } from "franja-horaria/entities/franja-horaria.entity";

@Entity()   
export class DistribucionDia {

    @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  diasemana: string; // Ejemplo: 'Lunes'

  @Column('float')
  horasDia: number;

  @ManyToOne(() => Horario, (horario) => horario.distribuciones)
  @JoinColumn({ name: 'horario_id' })
  horario: Horario;

  @OneToMany(() => FranjaHoraria, (franja) => franja.distribucionDia, { cascade: true })
  franjas: FranjaHoraria[];

}