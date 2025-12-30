import { ArrayNotEmpty, IsArray, IsBoolean, IsDate, IsNotEmpty, IsString, MinLength } from "class-validator";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')

export class User {


    @PrimaryGeneratedColumn('uuid')
    id: string;


    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    @Column('text', { unique: true })
    telefono: string;

   

    @IsBoolean()
    @Column('bool', {default: false})
    isVerified: boolean;

    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    @Column('text', {array:true, default: ['user']})
    rol: string[];

    @Column({ 
    type: 'varchar', 
    nullable: true // Esto permite NULL en la base de datos
    })
    codigoOTP?: string | null; // El '?' y '| null' evitan el error de TypeScript ts(2322)

    @Column({ 
    type: 'timestamp', 
    nullable: true 
    })
    codigoExpiraEn?: Date | null;

}


