import { User } from "auth/entities/user.entity";
import { Empresa } from "empresas/entities/empresa.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { DistribucionDia } from "./distribucion-dia.entity";

@Entity()
export class Horario {

 @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  fecha_inicio: Date;

  @Column({ type: 'date' })
  fecha_fin: Date;

  @Column()
  tipo: string; // Ejemplo: 'Rotativo', 'Fijo'

  @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @OneToMany(() => DistribucionDia, (dist) => dist.horario, { cascade: true })
  distribuciones: DistribucionDia[];
  
  @OneToMany(() => User, (u) => u.horario)
  usuarios: User[];
}
