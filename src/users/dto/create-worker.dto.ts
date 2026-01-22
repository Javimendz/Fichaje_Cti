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
export class CreateWorkerDto { // DTO para crear un WORKER

  // --- IDENTIFICACIÓN Y CONTACTO ---
  @IsString() // Valida que sea una cadena
  @IsNotEmpty() // No puede estar vacío
  @Matches(/^\+?[0-9]{9,15}$/, { message: 'Teléfono inválido' }) // Formato válido
  telefono: string; // Teléfono del trabajador

  @IsString() // Valida que sea una cadena
  @IsNotEmpty() // No puede estar vacío
  @Matches(/^[0-9]{8}[A-Z]$/, { message: 'DNI inválido' }) // Formato válido
  dni: string; // Documento Nacional de Identidad

  @IsString() // Valida que sea una cadena
  @IsNotEmpty() // No puede estar vacío
  nombre: string; // Nombre del trabajador

  @IsOptional() // Campo opcional
  @IsString() // Valida que sea una cadena
  apellidos?: string; // Apellidos del trabajador

  @IsOptional() // Campo opcional
  @IsEmail() // Valida que sea un email válido
  email?: string;  // Correo electrónico

  // --- DATOS PERSONALES Y LOCALIZACIÓN ---
  @IsOptional() // Campo opcional
  @IsDateString() // Valida que sea una cadena en formato de fecha ISO
  fechaNacimiento?: string; // Fecha de nacimiento

  @IsOptional() // Campo opcional
  @IsString() // Valida que sea una cadena
  calle?: string; // Calle de la dirección

  @IsOptional() // Campo opcional
  @IsString() // Valida que sea una cadena
  poblacion?: string; // Población de la dirección

  @IsOptional() // Campo opcional
  @IsString() // Valida que sea una cadena
  provincia?: string; // Provincia de la dirección

  @IsOptional() // Campo opcional
  @IsString() // Valida que sea una cadena
  pais?: string; // País de la dirección

  // --- CATEGORÍA Y ACTIVIDAD LABORAL ---
  @IsOptional() // Campo opcional
  @IsString() // Valida que sea una cadena 
  categoria?: string; // Categoría del trabajador

  @IsOptional() // Campo opcional
  @IsString() // Valida que sea una cadena
  actividad?: string; // Actividad del trabajador

  @IsOptional() // Campo opcional
  @IsNumber() // Valida que sea un número
  @Type(() => Number) // Convierte a número
  diaPertenece?: number; // Día de pertenencia

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

  @IsNotEmpty() // No puede estar vacío
  codigoOTP?: {  // Código OTP y su expiración
    codigo: string; // Código OTP
    expiracion: Date; // Fecha de expiración del código OTP
  };
}