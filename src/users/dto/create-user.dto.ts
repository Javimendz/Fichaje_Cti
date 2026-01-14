import { IsEmail, IsString, MinLength, IsNotEmpty, IsOptional, IsDateString, IsNumber, IsArray, Min, min } from 'class-validator';

export class CreateUserDto {
    
    @IsString()
    @MinLength(8)
    telefono: string;

    @IsOptional()
    @IsString()
    @MinLength(8)
    dni?: string;
  

    @IsString()
    @IsOptional() 
    @MinLength(3)
    nombre?: string;

    @IsOptional()
    @IsString()
    @MinLength(3)
    apellidos?: string;
    

    @IsDateString()
    @IsOptional()
    fechaNacimiento?: Date;

    @IsString()
    @IsOptional()
    calle?: string;

    @IsString()
    @IsOptional()
    poblacion?: string;

    @IsString()
    @IsOptional()
    provincia?: string;

    @IsString()
    @IsOptional()
    pais?: string;

    @IsString()
    @IsOptional()
    categoria?: string;

    @IsString()
    @IsOptional()
    actividad?: string;

    @IsNumber()
    @IsOptional()
    diaPertenece?: number;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    rol?: string[];

    @IsNotEmpty()
    codigoOTP?: { 
      codigo: string;
      expiracion: Date;
    };
    
 
}