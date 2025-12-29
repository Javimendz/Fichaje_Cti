import { IsOptional, IsString, MinLength, IsDate } from 'class-validator';

export class UpdateAuthDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  apellidos?: string;

  @IsOptional()
  @IsDate()
  fecha_nacimiento?: Date;

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
}
