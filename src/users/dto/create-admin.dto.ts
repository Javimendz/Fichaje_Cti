import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  Matches,
} from 'class-validator';
/**
 * 
 * CreateAdminDto
 * DTO para crear un usuario ADMIN.
 * Contiene propiedades para la identificación, contacto,
 * datos personales, localización, empresa asociada y seguridad.
 * Utiliza class-validator para validar los datos de entrada.
 * @property {string} nombre - Nombre del admin (requerido).
 * @property {string} [apellidos] - Apellidos del admin (opcional).
 * @property {string} dni - DNI del admin (requerido, formato válido).
 * @property {string} email - Correo electrónico del admin (requerido, formato válido).
 * @property {string} password - Contraseña del admin (requerido, mínimo 8 caracteres).
 * @property {string} telefono - Teléfono del admin (requerido, formato válido).
 * @property {string} empresaId - ID de la empresa asociada (requerido).
 * @property {Date} [fechaNacimiento] - Fecha de nacimiento del admin (opcional).
 * @property {string} [calle] - Calle del admin (opcional).
 * @property {string} [poblacion] - Población del admin (opcional).
 * @property {string} [provincia] - Provincia del admin (opcional).
 * @property {string} [pais] - País del admin (opcional).
 * @uses class-validator para validación de datos.
 * 
 */
export class CreateAdminDto {
  // Datos obligatorios
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
