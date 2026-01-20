import { IsNotEmpty, IsString, Matches, IsOptional, IsUUID } from 'class-validator';

export class CreateFranjaHorariaDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato debe ser HH:mm' })
  inicio: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato debe ser HH:mm' })
  fin: string;

  @IsOptional() // 👈 Cambia @IsNotEmpty por @IsOptional
  @IsUUID()
  distribucionDiaId?: string; 
}