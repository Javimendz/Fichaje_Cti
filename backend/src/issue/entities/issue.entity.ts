import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  DeleteDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';


export enum IncidenciaTipo {
  // --- RELACIONADAS CON EL REGISTRO (ERRORES DE USUARIO) ---
  OLVIDO_ENTRADA = 'OLVIDO_ENTRADA',       // Olvidó marcar al llegar
  OLVIDO_SALIDA = 'OLVIDO_SALIDA',         // Olvidó marcar al irse
  FICHAJE_DUPLICADO = 'FICHAJE_DUPLICADO',     // Marcó dos veces seguidas por error
  ENTRADA_TARDIA = 'ENTRADA_TARDIA',       // Llegó tarde (sin permiso previo)
  SALIDA_ANTICIPADA = 'SALIDA_ANTICIPADA', // Se fue antes (sin permiso previo)

  // --- FALLOS TÉCNICOS (ERRORES DEL SISTEMA) ---
  ERROR_GPS = 'ERROR_GPS',                 // La App no detectó la ubicación
  FALLO_DISPOSITIVO = 'FALLO_DISPOSITIVO', // Móvil sin batería o roto
  SIN_INTERNET = 'SIN_INTERNET',           // No hubo conexión para subir el fichaje
  ERROR_APP = 'ERROR_APP',                 // La aplicación se bloqueó

  // --- OTROS ---
  OTROS = 'OTROS'
}
@Entity('incidencias')
@Index(['userId', 'createdAt'])
export class Issue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: IncidenciaTipo })
  tipo: IncidenciaTipo;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'empresa_id' })
  empresaId: number;

  @Column({ type: 'text', nullable: true })
  nombre: string | null;

  @Column({ type: 'text', nullable: true })
  apellidos: string | null;

  @DeleteDateColumn()
  deletedAt: Date;

  @Column({ type: 'boolean', default: false })
  estado: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.incidencias, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'user_id' })
  usuario: User;


}
