import { Expose, Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, IsOptional, IsInt, Min } from 'class-validator';

export class CreateTimeSlotDto {
  @IsNotEmpty({ message: 'La hora de inicio es obligatoria' })
  @IsString()
  // Regex: Valida desde 00:00 hasta 23:59
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { 
    message: 'El formato de inicio debe ser HH:mm en formato 24h (ej: 08:00 o 14:30)' 
  })
  // Saneamiento: Limpia espacios para evitar fallos en la comparación de strings
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Expose()
  inicio: string;

  @IsString({ message: 'La hora de fin debe ser una cadena de texto' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { 
    message: 'El formato de fin debe ser HH:mm en formato 24h (ej: 18:30)' 
  })
  // Saneamiento: Elimina espacios accidentales para evitar fallos de coincidencia
@Transform(({ value }) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed; // Convierte "" en null
  }
  return value;
})  @Expose()
  fin?: string;

 @IsOptional()
  @IsInt({ message: 'El ID de distribución debe ser un número entero' })
  @Min(1, { message: 'El ID de distribución debe ser un número positivo' })
  // Saneamiento robusto: convierte a número solo si es un valor convertible,
  // de lo contrario mantiene el valor para que IsInt detecte el error.
  @Transform(({ value }) => {
    if (value === undefined || value === null) return value;
    const transformed = Number(value);
    return isNaN(transformed) ? value : transformed;
  })
  @Expose()
  distribucionDiaId?: number;
}