// src/allowed-user/dto/create-allowed-user.dto.ts
import { Expose, Transform } from 'class-transformer';
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsEmail, 
  
  IsDateString, 
  IsNumber, 
  Matches, 
  MinLength,
  MaxLength,
  Min,
  Max,
  IsInt
} from 'class-validator';
import { IsDni } from '../../auth/decorators/isDniConstraint';

export class CreateAllowedUserDto {
  
  // ============================================
  // IDENTIFICACIÓN (Obligatorios)
  // ============================================
  @IsString()
  @IsNotEmpty({ message: 'El teléfono es obligatorio' })
  @Matches(/^[0-9]{9,15}$/, { message: 'El teléfono debe tener entre 9 y 15 dígitos' })
  telefono: string;

  @IsOptional()
  @IsString({ message: 'El DNI debe ser una cadena de texto' })
  // Estandarización: Quita espacios, guiones y convierte la letra a MAYÚSCULA
  @Transform(({ value }) => typeof value === 'string' ? value.trim().replace(/[-\s]/g, '').toUpperCase() : value)
  @IsDni({message: 'El DNI introducido es inválido (la letra no corresponde al número)'})
  @Expose()
  dni?: string;

  @IsOptional()
  @IsString({ message: 'El email debe ser una cadena de texto' })
  @IsEmail({}, { message: 'El formato del email no es válido (ej: usuario@empresa.com)' })
  // Normalización: convierte a minúsculas y elimina espacios accidentales
  @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase().trim() : value)
  @Expose()
  email?: string;
  // ============================================
  // DATOS PERSONALES
  // ============================================
 @IsString()
  @IsOptional()
  // Permite letras (A-Z, a-z), tildes, ñ, Ñ, espacios y guiones
  @Matches(/^[a-zA-Zà-ÿÀ-ßñÑ\s'-]+$/, {
    message: 'El nombre solo puede contener letras, espacios y guiones',
  })
  @MinLength(2, { message: 'El nombre es demasiado corto' })
  @MaxLength(50, { message: 'El nombre es demasiado largo' })
  nombre?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Zà-ÿÀ-ßñÑ\s'-]+$/, {
    message: 'Los apellidos solo pueden contener letras, espacios, guiones o apóstrofos',
  })
  @MinLength(2, { message: 'Los apellidos deben tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'Los apellidos no pueden exceder los 100 caracteres' })
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
  // Permite: Letras, números, espacios, tildes, ñ, y símbolos: , . / - º ª
  @Matches(/^[a-zA-Z0-9à-ÿÀ-ßñÑ\s\.,\/\-ºª]+$/, {
    message: 'La calle contiene caracteres no permitidos (solo letras, números y símbolos comunes como º o ª)',
  })
  @MaxLength(150, { message: 'La dirección es demasiado larga (máximo 150 caracteres)' })
  calle?: string;

  @IsString()
  @IsOptional()
  // Permite: Letras, espacios, tildes, ñ, y números (opcional)
  @Matches(/^[a-zA-Zà-ÿÀ-ßñÑ\s0-9'-]+$/, {
    message: 'La población solo puede contener letras, números y espacios',
  })
  @MinLength(2, { message: 'El nombre de la población es demasiado corto' })
  @MaxLength(100, { message: 'El nombre de la población es demasiado largo' })
  poblacion?: string;

  @IsString()
  @IsOptional()
  // Permite: Letras, espacios, tildes, ñ/Ñ, ç/Ç, y el punto volado (·) para provincias como Castelló
  @Matches(/^[a-zA-Zà-ÿÀ-ßñÑçÇ\s·'-]+$/, {
    message: 'La provincia solo puede contener letras y caracteres geográficos válidos',
  })
  @MinLength(3, { message: 'El nombre de la provincia es demasiado corto' })
  @MaxLength(50, { message: 'El nombre de la provincia es demasiado largo' })
  provincia?: string;

  @IsString()
  @IsOptional()
  // Permite: Letras, espacios, tildes, ñ, y puntos (ej: EE.UU.)
  @Matches(/^[a-zA-Zà-ÿÀ-ßñÑ\s\.-]+$/, {
    message: 'El país solo puede contener letras, espacios o puntos',
  })
  @MinLength(3, { message: 'El nombre del país debe tener al menos 3 caracteres' })
  @MaxLength(60, { message: 'El nombre del país es demasiado largo' })
  pais?: string;

  // ============================================
  // DATOS LABORALES
  // ============================================
  @IsString()
  @IsOptional()
  // Permite: Letras, números, tildes, ñ, espacios y símbolos: / - . º ª
  @Matches(/^[a-zA-Z0-9à-ÿÀ-ßñÑ\s\/\-\.ºª]+$/, {
    message: 'La categoría contiene caracteres no permitidos',
  })
  @MinLength(2, { message: 'La categoría es demasiado corta' })
  @MaxLength(80, { message: 'La categoría no puede exceder los 80 caracteres' })
  categoria?: string;

  @IsString()
  @IsOptional()
  // Permite: Letras, números, tildes, ñ, espacios y símbolos: / - . , ( )
  @Matches(/^[a-zA-Z0-9à-ÿÀ-ßñÑ\s\/\-\.\,\(\)]+$/, {
    message: 'La actividad contiene caracteres no permitidos',
  })
  @MinLength(3, { message: 'La descripción de la actividad es muy corta' })
  @MaxLength(100, { message: 'La actividad no puede exceder los 100 caracteres' })
  actividad?: string;

  @IsNumber({}, { message: 'El día debe ser un valor numérico' })
  @IsInt({ message: 'El día debe ser un número entero (sin decimales)' })
  @IsOptional()
  @Min(1, { message: 'El día no puede ser menor a 1' })
  @Max(31, { message: 'El día no puede ser mayor a 31' })
  diaPertenece?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El ID de horario debe ser un número' })
  @IsInt({ message: 'El ID de horario debe ser un número entero' })
  @Min(1, { message: 'El ID de horario debe ser un valor positivo' })
  horarioId?: number; // UUID del horario pre-asignado

  
}





