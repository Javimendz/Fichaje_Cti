import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../auth/entities/user.entity";
import { Company } from "../../company/entities/company.entity";

@Entity('mail')
export class Mail {

    
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'varchar', length:150})
    destinatario: string;

    @Column({type: 'varchar', length:250})
    asunto: string;

    @Column({type: 'varchar', length:50})
    tipoCorreo: string;

    @Column({type: 'varchar', length:20, default: 'ENVIADO'})
    estado: string;

    @Column({type: 'text', nullable: true})
    mensajeError?: string;

    @Column({type: 'int', nullable: true})
    usuarioId?: number;

    @ManyToOne(() => User, {onDelete: 'SET NULL'})
    @JoinColumn({ name: 'usuarioId'})
    usuario?: User;

    @Column({type: 'int', nullable: true})
    empresaId?: number;

    @ManyToOne(() => Company, {onDelete: 'SET NULL'})
    @JoinColumn({name: 'empresaId'})
    empresa?: Company;

    @CreateDateColumn()
    enviadoEn:Date;

}
