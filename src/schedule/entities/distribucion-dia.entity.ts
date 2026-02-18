import { 
  Column, 
  CreateDateColumn, 
  DeleteDateColumn, 
  Entity, 
  JoinColumn, 
  ManyToOne, 
  OneToMany, 
  PrimaryGeneratedColumn,
  Index 
} from "typeorm";
import { Horario } from "./schedules.entity"; // Ajusta ruta
import { FranjaHoraria } from "../../timeSlot/entities/franja-horaria.entity"; // Ajusta ruta
import { Exclude } from "class-transformer";

export enum DiaSemana {
  LUNES = 'LUNES',
  MARTES = 'MARTES',
  MIERCOLES = 'MIERCOLES',
  JUEVES = 'JUEVES',
  VIERNES = 'VIERNES',
  SABADO = 'SABADO',
  DOMINGO = 'DOMINGO',
}

@Entity('distribucion_dia')
export class DistribucionDia {


  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: DiaSemana,
    default: DiaSemana.LUNES
  })
  diaSemana: DiaSemana;

  @Column('float', { default: 0 })
  horasDia: number;

  // PADRE
  @ManyToOne(() => Horario, (horario) => horario.distribuciones, { 
    onDelete: 'CASCADE',
    nullable: false
  })
  @Exclude()
  @JoinColumn({ name: 'horario_id' })
  horario: Horario;

  // FK de lectura (correcta así)
  @Column({ name: 'horario_id' })
  @Index()
  horarioId: number;

  // HIJOS
  @OneToMany(() => FranjaHoraria, (franja) => franja.distribucionDia, {
    cascade: true,
    eager: true
  })
  franjas: FranjaHoraria[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  


  
}