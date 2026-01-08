import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  Matches,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWorkerDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{9,15}$/, { message: 'Teléfono inválido' })
  telefono: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{8}[A-Z]$/, { message: 'DNI inválido' })
  dni: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsOptional()
  @IsString()
  apellidos?: string;

  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @IsOptional()
  @IsString()
  calle?: string;

  @IsOptional()
  @IsString()
  poblacion?: string;

  @IsOptional()
  @IsString()
  provincia?: string;

  @IsOptional()
  @IsString()
  pais?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsString()
  actividad?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  diaPertenece?: number;

  @IsOptional()
  @IsEmail()
  email?: string; 

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  horarioId?: number;

  @IsNotEmpty()
  @IsString()
  empresaId: string;
}