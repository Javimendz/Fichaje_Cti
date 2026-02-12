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
import { Horario } from "./schedules.entity";
import { FranjaHoraria } from "timeSlot/entities/franja-horaria.entity";

// Definimos un Enum para evitar errores de tipeo (Lunes vs lunes vs Monday)
export enum DiaSemana {
  LUNES = 'LUNES',
  MARTES = 'MARTES',
  MIERCOLES = 'MIERCOLES',
  JUEVES = 'JUEVES',
  VIERNES = 'VIERNES',
  SABADO = 'SABADO',
  DOMINGO = 'DOMINGO',
}

@Entity('distribucion_dia') // Buena práctica: definir nombre de tabla explícito snake_case
export class DistribucionDia {

  @PrimaryGeneratedColumn()
  id: number;

  // --- INFORMACIÓN DEL DÍA ---
  
  @Column({
    type: 'enum',
    enum: DiaSemana,
    default: DiaSemana.LUNES
  })
  diaSemana: DiaSemana; // Ahora es tipado fuerte

  @Column('float', { default: 0 }) // Default 0 evita nulos en cálculos
  horasDia: number;

  // --- RELACIONES ---

  // 1. RELACIÓN PADRE (HORARIO)
  // onDelete: 'CASCADE' -> Si borras el Horario, se borran sus días (DB Level)
  @ManyToOne(() => Horario, (horario) => horario.distribuciones, { 
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete' // Ayuda a TypeORM a limpiar huérfanos
  })
  @JoinColumn({ name: 'horario_id' })
  horario: Horario;

  // Columna explícita para evitar Joins innecesarios
  // Le ponemos @Index porque buscaremos mucho por "dame los días de este horario"
  @Column({ name: 'horario_id' })
  @Index() 
  horarioId: number;

  // 2. RELACIÓN HIJA (FRANJAS)
  // cascade: true -> Si guardas este Día, se guardan sus franjas automáticamente
  @OneToMany(() => FranjaHoraria, (franja) => franja.distribucionDia, { 
    cascade: true,
    eager: false // Mantenemos false para no saturar memoria si no se pide
  })
  franjas: FranjaHoraria[];

  // --- AUDITORÍA ---
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', select: false }) // select: false para no traerlo siempre
  deletedAt: Date;
}