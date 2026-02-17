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

  // --- RELACIONES ---

  // 1. RELACIÓN PADRE (HORARIO)
  @ManyToOne(() => Horario, (horario) => horario.distribuciones, { 
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
    nullable: false // Importante: Asegura que siempre tenga padre
  })
  @Exclude()
  @JoinColumn({ name: 'horario_id' }) // TypeORM CREA la columna 'horario_id' aquí
  horario?: Horario;

  // Si necesitas acceder al ID sin cargar la relación, usa 'relationId' en el servicio
  // o defínela como solo lectura así:
  @Column({ name: 'horario_id', nullable: true, insert: false, update: false })
  @Index() 
  horarioId: number; 
  //  Al poner insert: false, TypeORM ignora esta propiedad al guardar
  // y usa la relación 'horario' para llenar el dato.

  // 2. RELACIÓN HIJA (FRANJAS)
  @OneToMany(() => FranjaHoraria, (franja) => franja.distribucionDia, { 
    cascade: true, // Permite guardar franjas automáticamente
  })
  franjas: FranjaHoraria[];

  // --- AUDITORÍA ---
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', select: false })
  deletedAt: Date;
}