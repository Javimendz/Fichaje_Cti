import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, Length } from "class-validator";


export class SendPinDto{

    @IsEmail({},{message:' El formato del email no es válido'})
    @IsNotEmpty()
    email: string | null;

    @IsNotEmpty()
    @IsString()
    nombre: string  | null;

    @IsNotEmpty()
    @IsString()
    @Length(6,6, { message: 'El PIN debe tener 6 caracteres' })
    pin: string;

    @IsBoolean()
    @IsOptional()
    esNuevoPin?: boolean

}