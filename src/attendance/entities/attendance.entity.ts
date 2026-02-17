import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  JoinColumn, 
  CreateDateColumn 
} from 'typeorm';
import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { User } from 'users/entities/user.entity';

@Entity('attendances')
export class Attendance {
  
  @PrimaryGeneratedColumn()
  id: number;

  // -----------------------------------------------------
  // COLUMNA DE CLAVE FORÁNEA (EXPLÍCITA)
  // -----------------------------------------------------
  // Es útil tener el ID disponible sin cargar toda la relación.
  // Nota: Debe coincidir con el nombre en @JoinColumn
  @Column({ name: 'usuario_id' })
  @IsNotEmpty({ message: 'El ID del usuario es obligatorio' })
  @IsNumber({}, { message: 'El usuarioId debe ser un número' })
  usuarioId: number;

  // -----------------------------------------------------
  // DATOS DE LA ASISTENCIA
  // -----------------------------------------------------
  @CreateDateColumn({ type: 'timestamp', name: 'fecha' })
  @IsDate()
  fecha: Date;

  @Column({ type: 'boolean', default: false })
  @IsBoolean({ message: 'El campo presente debe ser verdadero o falso' })
  presente: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString({ message: 'El motivo debe ser texto' })
  @MaxLength(255, { message: 'El motivo no puede superar los 255 caracteres' })
  motivo?: string;

  // -----------------------------------------------------
  // RELACIONES
  // -----------------------------------------------------
  // Solución al error de borrado: onDelete: 'CASCADE'
  @ManyToOne(() => User, (user) => user.attendances, { 
    onDelete: 'CASCADE', 
    nullable: false 
  })
  @JoinColumn({ name: 'usuario_id' }) // Vincula la propiedad 'usuario' con la columna 'usuario_id'
  usuario: User;
}