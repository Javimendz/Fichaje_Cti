import { IsEmail, IsString, MinLength, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserDto {
    
    @IsString()
    telefono: string;

    @IsOptional()
    @IsString()
    @MinLength(8)
    dni?: string;
  

    @IsString()
    @IsOptional()
    nombre: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsString()
    @IsNotEmpty()
    role: string;
}