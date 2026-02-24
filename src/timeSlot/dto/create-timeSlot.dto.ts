import { Expose, Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, IsOptional, IsInt, Min } from 'class-validator';

export class CreateTimeSlotDto {
 @IsNotEmpty({ message: 'La hora de inicio es obligatoria' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { 
    message: 'El formato de inicio debe ser HH:mm en formato 24h (ej: 08:00 o 14:30)' 
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Expose()
  inicio: string;

  @IsString({ message: 'La hora de fin debe ser una cadena de texto' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { 
    message: 'El formato de fin debe ser HH:mm en formato 24h (ej: 18:30)' 
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed === '' ? null : trimmed;
    }
    return value;
  })  
  @Expose()
  fin?: string;

  // 🛡️ CORRECCIÓN: Debe ser obligatorio crear la franja apuntando a un día
  @IsNotEmpty({ message: 'El ID de la distribución del día es obligatorio' }) 
  @IsInt({ message: 'El ID de distribución debe ser un número entero' })
  @Min(1, { message: 'El ID de distribución debe ser un número positivo' })
  @Transform(({ value }) => {
    if (value === undefined || value === null) return value;
    const transformed = Number(value);
    return isNaN(transformed) ? value : transformed;
  })
  @Expose()
  distribucionDiaId: number; // Quitamos el opcional (?)
}