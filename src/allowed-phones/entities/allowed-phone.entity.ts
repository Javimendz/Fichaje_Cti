
import { Empresa } from 'empresa/entities/empresa.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('allowed_phones')
export class AllowedPhone {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  telefono: string;


  @Column({ nullable: true })
  empresaId: string;

 @ManyToOne(() => Empresa)
  @JoinColumn({ name: 'empresaId' }) // Esto vincula la columna con la relación
  empresa: Empresa;

  @Column({ default: true })
  active: boolean; // Si el número sigue autorizado

  @Column({ default: false })
  used: boolean; // Si ya se registró

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date; // Opcional: fecha de caducidad de autorización

  @Column({ nullable: true })
  addedBy?: string; // Id del admin que añadió el número

  @Column({ nullable: true })
  source?: string; // Fuente del número (por ejemplo, CSV, app, import)
}