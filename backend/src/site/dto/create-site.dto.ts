import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateSiteDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la obra es obligatorio' })
  name: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  direccion: string;

  @IsString()
  @IsOptional() // O IsNotEmpty si quieres que sea obligatorio
  poblacion: string;

  @IsString()
  @IsOptional()
  codigoPostal?: string;

  @IsString()
  @IsOptional()
  provincia?: string;

  @IsString()
  @IsOptional()
  pais?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsNumber()
  @IsOptional()
  @Min(10, { message: 'El radio mínimo son 10 metros' })
  radiusMeters?: number = 100; // Por defecto 100m si no se especifica
}