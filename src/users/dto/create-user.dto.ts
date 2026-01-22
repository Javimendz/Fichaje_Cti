import { IsEmail, IsString, MinLength, IsNotEmpty, IsOptional, IsDateString, IsNumber, IsArray, Min } from 'class-validator';

/**
 * CreateUserDto
 * DTO para la creación de un nuevo usuario.
 * Contiene propiedades para la identificación, contacto, datos personales,
 * localización, categoría laboral, roles y seguridad.
 * Utiliza class-validator para validar los datos de entrada.
 * @property {string} telefono - Teléfono del usuario (requerido, mínimo 8 caracteres).
 * @property {string} [dni] - DNI del usuario (opcional, mínimo 8 caracteres).
 * @property {string} [nombre] - Nombre del usuario (opcional, mínimo 3 caracteres).  
 * @property {string} [apellidos] - Apellidos del usuario (opcional, mínimo 3 caracteres).
 * @property {Date} [fechaNacimiento] - Fecha de nacimiento del usuario (opcional, formato de fecha).
 * @property {string} [calle] - Calle del usuario (opcional).
 * @property {string} [poblacion] - Población del usuario (opcional).
 * @property {string} [provincia] - Provincia del usuario (opcional).
 * @property {string} [pais] - País del usuario (opcional).
 * @property {string} [categoria] - Categoría laboral del usuario (opcional).
 *  @property {string} [actividad] - Actividad laboral del usuario (opcional).
 * @property {number} [diaPertenece] - Día de pertenencia del usuario (opcional, número).
 * @property {string[]} [rol] - Arreglo de roles del usuario (opcional).
 * @property {Object} [codigoOTP] - Código OTP para verificación (opcional, no vacío).
 * @uses class-validator para validación de datos.
 *  
 */
export class CreateUserDto {
    
    // --- IDENTIFICACIÓN Y CONTACTO ---
    @IsString()
    @MinLength(8)
    telefono: string;

    @IsOptional()
    @IsString()
    @MinLength(8)
    dni?: string;

    @IsString()
    @IsOptional() 
    @MinLength(3)
    nombre?: string;

    @IsOptional()
    @IsString()
    @MinLength(3)
    apellidos?: string;

    // --- DATOS PERSONALES Y LOCALIZACIÓN ---
    @IsDateString()
    @IsOptional()
    fechaNacimiento?: Date;

    @IsString()
    @IsOptional()
    calle?: string;

    @IsString()
    @IsOptional()
    poblacion?: string;

    @IsString()
    @IsOptional()
    provincia?: string;

    @IsString()
    @IsOptional()
    pais?: string;

    // --- CATEGORÍA Y ACTIVIDAD LABORAL ---
    @IsString()
    @IsOptional()
    categoria?: string;

    @IsString()
    @IsOptional()
    actividad?: string;

    @IsNumber()
    @IsOptional()
    diaPertenece?: number;

    // --- ROLES Y SEGURIDAD ---
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    rol?: string[];

    @IsNotEmpty()
    codigoOTP?: { 
      codigo: string;
      expiracion: Date;
    };
}