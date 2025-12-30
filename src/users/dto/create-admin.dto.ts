import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAdminDto {
  @IsString()
  @IsNotEmpty()
  telefono: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  apellidos?: string;

    @IsString()
  @IsNotEmpty()
  dni: string;

  // Otros campos opcionales del usuario
  fechaNacimiento?: Date;
  calle?: string;
  poblacion?: string;
  provincia?: string;
  pais?: string;
}