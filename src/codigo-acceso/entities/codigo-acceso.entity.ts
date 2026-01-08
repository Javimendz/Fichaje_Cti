import { User } from "auth/entities/user.entity";
import { Column, ManyToMany, PrimaryGeneratedColumn } from "typeorm";

export class CodigoAcceso {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToMany(() => User)
    usuarios: User[];

    @Column('text', { unique: true })
    codigo: string;

    @Column()
    expiracion: Date;

    @Column({ default: false })
    usado: boolean;

}
