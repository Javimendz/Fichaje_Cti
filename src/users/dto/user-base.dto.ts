import { IsEmail, IsOptional, IsString, IsNotEmpty, Matches, IsDateString, IsNumber, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class UserBaseDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsOptional()
  @IsString()
  apellidos?: string;

  // CAMBIO: Ahora es opcional para que el hijo decida si lo pide o no
  @IsOptional() 
  @IsString()
  @Matches(/^[0-9]{8}[A-Z]$/i, { message: 'Formato de DNI inválido (Ej: 12345678Z)' })
  dni?: string;

  // CAMBIO: Ahora es opcional
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{9,15}$/, { message: 'Teléfono inválido' })
  telefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email de usuario inválido' })
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
}