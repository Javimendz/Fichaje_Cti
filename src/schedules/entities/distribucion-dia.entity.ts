import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Horario } from "./horario.entity";
import { FranjaHoraria } from '../../franja-horaria/entities/franja-horaria.entity';
import { IsNotEmpty, IsNumber } from "class-validator";

@Entity()   
export class DistribucionDia {

    @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  diaSemana: string; // Ejemplo: 'Lunes'

  @IsNotEmpty() // 👈 Añade esto
  @IsNumber()
  @Column('float')
  horasDia: number;

  @ManyToOne(() => Horario, (horario) => horario.distribuciones)
  @JoinColumn({ name: 'horario_id' })
  horario: Horario;

  @OneToMany(() => FranjaHoraria, (franja) => franja.distribucionDia, { cascade: true, onDelete: 'CASCADE'})
  franjas: FranjaHoraria[];

  @Column({ name: 'horario_id' })
horarioId: string;

}