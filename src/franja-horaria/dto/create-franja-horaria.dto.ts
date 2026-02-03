import { IsNotEmpty, IsString, Matches, IsOptional, IsInt, Min } from 'class-validator';

export class CreateFranjaHorariaDto {
  @IsNotEmpty({ message: 'La hora de inicio es obligatoria' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'El formato de inicio debe ser HH:mm (24h)' })
  inicio: string;

  @IsNotEmpty({ message: 'La hora de fin es obligatoria' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'El formato de fin debe ser HH:mm (24h)' })
  fin: string;

  @IsOptional()
  @IsInt({ message: 'El ID de distribución debe ser un número entero' }) // 👈 Cambiado de UUID a Int
  @Min(1)
  distribucionDiaId?: number; 
}