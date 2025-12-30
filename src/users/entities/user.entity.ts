import { UserRole } from "auth/roles.enum";
import { IsBoolean, IsNotEmpty, IsNumber, IsString, MinLength } from "class-validator";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";


@Entity('users')
export class User {

    @PrimaryGeneratedColumn()
    id: string;

    @IsString()
    @IsNotEmpty()
    @Column('text', { unique: true})
    telefono: string;

    @IsString()
    @IsNotEmpty()
     @Column({ type: 'varchar', nullable: false }) 
    dni: string;

    @IsString()
    @IsNotEmpty()
    @Column('text')
    nombre?: string;

    @IsString()
    @IsNotEmpty()
    @Column('text', { nullable: true })
    apellidos?: string;

    @IsString()
    @IsNotEmpty()
    @Column('date', { nullable: true })
    fechaNacimiento?: Date;


    @IsString()
    @IsNotEmpty()
    @Column('text', { nullable: true })
    calle?: string;


    @IsString()
    @IsNotEmpty()
    @Column('text', { nullable: true })
    poblacion?: string;

    @IsString()
    @IsNotEmpty()
    @Column('text', { nullable: true })
    provincia?: string;

    @IsString()
    @IsNotEmpty()
    @Column('text', { nullable: true })
    pais?: string;


    @IsString()
    @IsNotEmpty()
    @Column('text', { nullable: true })
    categoria?: string;

    @IsString()
    @IsNotEmpty()
    @Column('text', { nullable: true })
    actividad?: string;

    @IsBoolean()
    @IsNotEmpty()
    @Column('bool', {default: false})
    isVerified: boolean;

    @IsNumber()
    @IsNotEmpty()
    @Column('int', { nullable: true })
    diaPertenece: number;


    @IsString()
    @IsNotEmpty()
    @Column('text', { nullable: false })
    codigoOTP: string;

    @IsString()
    @MinLength(1)
    @Column('text', {array:true, default: [UserRole.USER]})
    rol: UserRole[];
}
