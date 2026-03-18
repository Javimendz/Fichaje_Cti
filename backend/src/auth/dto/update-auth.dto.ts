import { IsOptional, IsString, MinLength, IsDate } from 'class-validator';


// UpdateAuthDto
/**
 * * * * * UpdateAuthDto
 *  * * DTO para actualizar la información de un usuario autenticado. Contiene propiedades opcionales para los datos personales del usuario, como nombre, apellidos, fecha de nacimiento, dirección y otros detalles relevantes. Utiliza class-validator para validar los datos de entrada, asegurando que los campos sean del tipo correcto y cumplan con ciertos requisitos, como una longitud mínima para el nombre. Este DTO se utiliza en el proceso de actualización de la información del perfil del usuario, permitiendo que los usuarios modifiquen sus datos personales de manera segura y controlada.
 * */

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
