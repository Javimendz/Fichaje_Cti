import { User } from "../../auth/entities/user.entity";
import { Company } from "../../company/entities/company.entity"; // Asegúrate de importar tu entidad Empresa
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('jornadas')
export class Workday {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp' })
  inicio: Date;

  @Column({ type: 'timestamp', nullable: true })
  fin: Date;

  @Column({ type: 'int', nullable: true })
  total_segundos: number;

  @Column({ type: 'float', nullable: true })
  latitudEntrada: number;

  @Column({ type: 'float', nullable: true })
  longitudEntrada: number;

  @Column({ type: 'float', nullable: true })
  latitudSalida: number;

  @Column({ type: 'boolean', default: false })
    presente: boolean;

  @Column({ type: 'float', nullable: true })
  longitudSalida: number;

  @Column({ default: 'PRESENCIAL' })
  modalidad: string;

  @Column({ default: 'Entrada' })
  tipo: string; // "Entrada" o "Salida"

  @ManyToOne(() => User, (user) => user.jornadas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'empresa_id' })
  empresa: Company;
}