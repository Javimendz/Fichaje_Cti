import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { IncidenciaTipo } from '../entities/issue.entity';
import { Transform } from 'class-transformer';

export class CreateIncidenciaDto {
  @IsNotEmpty({ message: 'El tipo de incidencia es obligatorio' })
  @IsEnum(IncidenciaTipo, {
    message: 'El tipo de incidencia no es válido',
  })
  tipo: IncidenciaTipo;

  @IsString()
  @IsNotEmpty({ message: 'La descripción no puede estar vacía' })
  @MinLength(10, { message: 'La descripción debe tener mínimo 10 caracteres' })
  @MaxLength(500, { message: 'La descripción no puede superar los 500 caracteres' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value)
  descripcion: string;

  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(2, { message: 'El nombre es demasiado corto' })
  @MaxLength(50, { message: 'El nombre es demasiado largo' })
  @Matches(/^[a-zA-Zà-ÿÀ-ßñÑ\s]+$/, { message: 'El nombre solo puede contener letras y espacios' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value)
  nombre?: string;

  @IsOptional()
  @IsString({ message: 'Los apellidos deben ser una cadena de texto' })
  @MinLength(2, { message: 'Los apellidos son demasiado cortos' })
  @MaxLength(100, { message: 'Los apellidos no pueden superar los 100 caracteres' })
  @Matches(/^[a-zA-Zà-ÿÀ-ßñÑ\s]+$/, { message: 'Los apellidos solo pueden contener letras y espacios' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value)
  apellidos?: string;

  @IsOptional() // Normalmente al crear una incidencia, el estado tiene un valor por defecto
  @IsBoolean({ message: 'El estado debe ser un valor booleano (true o false)' })
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === 1 || value === '1') return true;
    if (value === 'false' || value === false || value === 0 || value === '0') return false;
    return value;
  })
  estado: boolean = false;
}
