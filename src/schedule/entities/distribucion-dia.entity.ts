import { 
  Column, 
  CreateDateColumn, 
  Entity, 
  JoinColumn, 
  ManyToOne, 
  OneToMany, 
  PrimaryGeneratedColumn,
  Index 
} from "typeorm";
import { Horario } from "./schedules.entity"; 
import { FranjaHoraria } from "../../timeSlot/entities/franja-horaria.entity"; 
import { Exclude } from "class-transformer";

/// DistribucionDia Entity
/**
 * DistribucionDia Entity
 * Representa la distribución de horas para un día específico dentro de un horario.
 * Contiene información sobre el día de la semana, las horas asignadas para ese día y las franjas horarias asociadas.
 * Define las columnas de la tabla 'distribucion_dia' en la base de datos y sus relaciones con el horario padre y las franjas horarias hijas.
 * @entity 'distribucion_dia' define el nombre de la tabla en la base de datos.
 * @see Horario para la relación con el horario al que pertenece esta distribución.
 * @see FranjaHoraria para la relación con las franjas horarias asignadas a este día.
 * @metadata createdAt para auditoría de registros.
 * @enum DiaSemana define los días de la semana disponibles para la distribución.
 *  
 */  
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