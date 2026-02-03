import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  Matches,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserBaseDto } from './user-base.dto';
/**
 * CreateWorkerDto
 * * DTO para crear un usuario con rol de WORKER.
 * Contiene propiedades necesarias para la creación de un trabajador,
 * incluyendo identificación, contacto, datos personales,
 * localización, categoría laboral, y seguridad.
 * Utiliza class-validator para validar los datos de entrada.
 * @property {string} telefono - Teléfono del trabajador (requerido, formato válido).
 * @property {string} dni - DNI del trabajador (requerido, formato válido).
 * @property {string} nombre - Nombre del trabajador (requerido).
 *  @property {string} [apellidos] - Apellidos del trabajador (opcional).
 * @property {string} [email] - Correo electrónico del trabajador (opcional, formato válido).
 * @property {string} [fechaNacimiento] - Fecha de nacimiento del trabajador (opcional, formato de fecha).
 * @property {string} [calle] - Calle del trabajador (opcional).
 * @property {string} [poblacion] - Población del trabajador (opcional).
 * @property {string} [provincia] - Provincia del trabajador (opcional).
 * @property {string} [pais] - País del trabajador (opcional).
 * @property {string} [categoria] - Categoría laboral del trabajador (opcional).
 * @property {string} [actividad] - Actividad laboral del trabajador (opcional).
 * @property {number} [diaPertenece] - Día de pertenencia del trabajador (opcional, número).
 * @property {number} [horarioId] - ID del horario asignado al trabajador (opcional, número).
 * @property {string} empresaId - ID de la empresa a la que pertenece el trabajador (requerido).
 * @property {string} [password] - Contraseña del trabajador (opcional).
 * @property {Object} codigoOTP - Código OTP para verificación (requerido, no vacío).
 * @uses class-validator para validación de datos.
 * 
 */
export class CreateWorkerDto extends UserBaseDto { // DTO para crear un WORKER

  // --- IDENTIFICACIÓN Y CONTACTO ---
 
 
  
 
  
  
 
 
  
  @IsOptional() // Campo opcional
  @IsNumber() // Valida que sea un número
  @Type(() => Number) // Convierte a número
  horarioId?: number; // ID del horario asignado

  // --- CUENTA Y SEGURIDAD ---
  @IsNotEmpty() // No puede estar vacío
  @IsString() // Valida que sea una cadena
  empresaId: string; // ID de la empresa a la que pertenece el trabajador

  @IsOptional() // Campo opcional
  @IsString() // Valida que sea una cadena
  password?: string; // Contraseña


}