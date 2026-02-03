import { User } from 'auth/entities/user.entity';
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  Matches,
  IsNumber,
} from 'class-validator';
import { UserBaseDto } from './user-base.dto';
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
export class CreateAdminDto extends UserBaseDto {
  // Datos obligatorios
 



  @IsEmail({}, { message: 'El email es obligatorio para el Admin' })
  @IsNotEmpty()
  declare email: string; // 'declare' soluciona el error de TypeScript

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  // Relación obligatoria
  @IsOptional()
  @IsNumber()
  empresaId?: number;



  
}
