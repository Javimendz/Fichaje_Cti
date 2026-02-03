// src/allowed-user/dto/create-allowed-user.dto.ts
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsEmail, 
  
  IsDateString, 
  IsNumber, 
  Matches, 
  MinLength
} from 'class-validator';

export class CreateAllowedUserDto {
  
  // ============================================
  // IDENTIFICACIÓN (Obligatorios)
  // ============================================
  @IsString()
  @IsNotEmpty({ message: 'El teléfono es obligatorio' })
  @Matches(/^[0-9]{9,15}$/, { message: 'El teléfono debe tener entre 9 y 15 dígitos' })
  telefono: string;

  @IsString()
  @IsOptional()
  dni?: string;

  @IsEmail({}, { message: 'El formato del email no es válido' })
  @IsOptional()
  email?: string;

  // ============================================
  // DATOS PERSONALES
  // ============================================
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  apellidos?: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña no puede estar vacía' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @IsDateString({}, { message: 'Fecha inválida (ISO8601)' })
  @IsOptional()
  fechaNacimiento?: string;

  // ============================================
  // DIRECCIÓN
  // ============================================
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

  // ============================================
  // DATOS LABORALES
  // ============================================
  @IsString()
  @IsOptional()
  categoria?: string;

  @IsString()
  @IsOptional()
  actividad?: string;

  @IsNumber()
  @IsOptional()
  diaPertenece?: number;

  @IsString()
  @IsOptional()
  horarioId?: string; // UUID del horario pre-asignado
}



