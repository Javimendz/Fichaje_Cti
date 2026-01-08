import { User } from "auth/entities/user.entity";
import { UserRole } from "auth/roles.enum";
import { Column, OneToMany, PrimaryGeneratedColumn } from "typeorm";

export class Rol {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text', { unique: true })
    nombre: UserRole;

    @OneToMany(() => User, (u) => u.rol)
    usuarios: User[];



}
