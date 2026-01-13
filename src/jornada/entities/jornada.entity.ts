import { User } from "auth/entities/user.entity";
import { Empresa } from "empresas/entities/empresa.entity"; // Asegúrate de importar tu entidad Empresa
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('jornadas')
export class Jornada {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp' })
  inicio: Date;

  @Column({ type: 'timestamp', nullable: true })
  fin: Date;

  @Column({ type: 'int', nullable: true })
  total_minutos: number;

  @Column({ type: 'float', nullable: true })
  latitud: number;

  @Column({ type: 'float', nullable: true })
  longitud: number;

  @Column()
  tipo: string; // "Entrada" o "Salida"

  @ManyToOne(() => User, (user) => user.jornadas, { eager: true, cascade: false })
usuario: User;

@ManyToOne(() => Empresa, { eager: true })
empresa: Empresa;
}