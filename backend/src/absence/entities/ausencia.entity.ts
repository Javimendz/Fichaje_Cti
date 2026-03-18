import { 
  Column, 
  Entity, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne, 
  JoinColumn, 
  Index 
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { AusenciaEstado, TipoAusencia } from 'absence/dto/ausencia-estado.enum';



@Entity('ausencias')
export class Ausencia {
  @PrimaryGeneratedColumn()
  id: number;

  //   Restringimos a valores exactos del Enum
  @Column({ type: 'enum', enum: TipoAusencia })
  tipo: TipoAusencia; 

  // Tipado correcto. TypeORM devuelve un string ('YYYY-MM-DD') 
  // cuando la columna es type: 'date'.
  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio: string;

  @Column({ name: 'fecha_fin', type: 'date' })
  fechaFin: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  motivo?: string | null;

  @Column({ type: 'enum', enum: AusenciaEstado, default: AusenciaEstado.APROBADA })
  estado: AusenciaEstado;

  //  Índices de Base de Datos y Tipos Explícitos ('int')
  @Index()
  @Column({ name: 'usuario_id', type: 'int' })
  usuarioId: number;

  @Index()
  @Column({ name: 'empresa_id', type: 'int' }) 
  empresaId: number;

  @Column({ name: 'dias_consumidos', type: 'int', default: 0 })
  diasConsumidos: number;

  @Column({ name: 'dias_totales', type: 'int', nullable: true })
  diasTotales: number;

  @ManyToOne(() => User, (user) => user.ausencias, { 
    nullable: false, 
    onDelete: 'CASCADE' 
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Rastro de auditoría
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}