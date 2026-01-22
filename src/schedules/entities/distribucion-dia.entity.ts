import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Horario } from "./horario.entity";
import { FranjaHoraria } from "franja-horaria/entities/franja-horaria.entity";

/**
 * DistribucionDia Entity
 * Representa la distribución de horas para un día específico dentro de un horario.
 * Contiene información sobre el día de la semana,
 * las horas asignadas y las franjas horarias asociadas.
 * Define las columnas de la tabla 'distribucion_dia' en la base de datos.
 * @entity 'distribucion_dia' define el nombre de la tabla en la base de datos.
 * @see Horario para la relación con el horario al que pertenece este día de distribución.
 * @see FranjaHoraria para la relación con las franjas horarias de este día.
 * @metadata para auditoría de registros.
 *  
 * 
 */
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