import { IsNotEmpty, IsString, IsUUID, Matches } from 'class-validator';

export class CreateFranjaHorariaDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):?([0-5]\d)$/, { message: 'Formato de inicio debe ser HH:mm' })
  inicio: string; // Ejemplo: "08:00"

  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):?([0-5]\d)$/, { message: 'Formato de fin debe ser HH:mm' })
  fin: string;    // Ejemplo: "14:00"

  @IsNotEmpty()
  @IsUUID()
  distribucionDiaId: string;
}