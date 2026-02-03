import { IsEmail, IsOptional, IsString, IsNotEmpty, Matches, IsDateString, IsNumber, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class UserBaseDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsOptional()
  @IsString()
  apellidos?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{8}[A-Z]$/, { message: 'DNI inválido' })
  dni: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{9,15}$/, { message: 'Teléfono inválido' })
  telefono: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @IsOptional()
  @IsString()
  pais?: string;
    
   
    @IsString()
    @IsOptional()
    calle?: string;

    @IsString()
    @IsOptional()
    poblacion?: string;

    @IsString()
    @IsOptional()
    provincia?: string;

   
    // --- CATEGORÍA Y ACTIVIDAD LABORAL ---
    @IsString()
    @IsOptional()
    categoria?: string;

    @IsString()
    @IsOptional()
    actividad?: string;

    @IsNumber()
    @IsOptional()
    diaPertenece?: number;

    // --- ROLES Y SEGURIDAD ---
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    rol?: string[];

}