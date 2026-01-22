import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

/**
 * CreateAllowedUserDto
 *  DTO para crear un usuario permitido.
 * Contiene propiedades para la identificación y contacto del usuario.
 * Utiliza class-validator para validar los datos de entrada.
 * @property {string} telefono - Teléfono del usuario (requerido).
 * @property {string} [nombre] - Nombre del usuario (opcional).
 * @property {string} [dni] - DNI del usuario (opcional).
 * @property {string} [email] - Correo electrónico del usuario (opcional, formato válido).
 * @uses class-validator para validación de datos.
 *  
 */
export class CreateAllowedUserDto {
  // --- IDENTIFICACIÓN Y CONTACTO ---
  @IsString()
  @IsNotEmpty()
  telefono: string;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  dni?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}