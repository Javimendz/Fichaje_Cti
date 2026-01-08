import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  Matches,
} from 'class-validator';

export class CreateAdminDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsOptional()
  @IsString()
  apellidos?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{8}[A-Z]$/, { message: 'DNI inválido' })
  dni: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @Matches(/^\+?[0-9]{9,15}$/, { message: 'Teléfono inválido' })
  telefono: string;

  // Relación obligatoria
  @IsNotEmpty()
  empresaId: string;

  // Datos opcionales
  @IsOptional()
  fechaNacimiento?: Date;

  @IsOptional()
  calle?: string;

  @IsOptional()
  poblacion?: string;

  @IsOptional()
  provincia?: string;

  @IsOptional()
  pais?: string;
}
