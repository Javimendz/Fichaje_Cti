import { DistribucionDia } from "../../schedule/entities/distribucion-dia.entity"; // Ajusta la ruta si es necesario
import { 
  Column, 
  CreateDateColumn, 
  DeleteDateColumn, 
  Entity, 
  JoinColumn, 
  ManyToOne, 
  PrimaryGeneratedColumn,
  UpdateDateColumn 
} from "typeorm";
import { IsNotEmpty, Matches } from "class-validator";
import { Exclude } from "class-transformer";

@Entity('franjas_horarias')
export class FranjaHoraria {
  @PrimaryGeneratedColumn()
  id: number;

  // -----------------------------------------------------
  // CLAVE FORÁNEA (Opcional pero recomendada)
  // -----------------------------------------------------
  // Te permite acceder al ID del padre sin cargar toda la relación
  @Column({ name: 'distribucion_dia_id' })
  distribucionDiaId: number;

  // -----------------------------------------------------
  // DATOS DE LA FRANJA (Validamos formato HH:MM)
  // -----------------------------------------------------
  @Column({ type: 'time', nullable: false }) // 'time' es mejor que varchar para SQL
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { 
    message: 'La hora de inicio debe tener el formato HH:MM (ej: 08:00)' 
  })
  inicio: string;

  @Column({ type: 'time', nullable: false })
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { 
    message: 'La hora de fin debe tener el formato HH:MM (ej: 18:00)' 
  })
  fin: string;

  // -----------------------------------------------------
  // RELACIONES
  // -----------------------------------------------------
  @ManyToOne(() => DistribucionDia, (dist) => dist.franjas, { 
    onDelete: 'CASCADE', // Si borras el día, se borran sus horas
    nullable: false 
  })
  @JoinColumn({ name: 'distribucion_dia_id' }) // Vinculamos con la columna física
  @Exclude()
  distribucionDia?: DistribucionDia;

  // -----------------------------------------------------
  // AUDITORÍA (Corregido)
  // -----------------------------------------------------
  
  @CreateDateColumn({ name: 'created_at' }) // Fecha de creación
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' }) // Fecha de última edición
  updatedAt: Date;

  // Si quieres Soft Delete (borrado lógico), usa esto.
  // Si no, bórralo. Pero NO mezcles CreateDate con deletedAt.
  @DeleteDateColumn({ name: 'deleted_at', nullable: true }) 
  deletedAt: Date; 
}