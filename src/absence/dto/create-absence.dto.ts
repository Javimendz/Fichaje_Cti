import { IsEnum, IsNotEmpty, IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateAbsenceDto {
  @IsNotEmpty()
  @IsString()
  tipo: string;

  @IsNotEmpty()
  @IsDateString()
  fecha_inicio: string;

  @IsNotEmpty()
  @IsDateString()
  fecha_fin: string;

  @IsOptional()
  @IsString()
  motivo: string;
}