import { User } from "auth/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
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
  tipo: string; // "Entrada" o "Salida" (según tu modelo)

  @ManyToOne(() => User, (usuario) => usuario.jornadas)
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;
}
