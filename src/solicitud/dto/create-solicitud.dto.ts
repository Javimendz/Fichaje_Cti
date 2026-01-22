import { IsEnum, IsDateString, IsString, IsOptional, MinLength } from 'class-validator';
import { TipoSolicitud } from '../entities/solicitud.entity';

/**
 * CreateSolicitudDto
 * DTO para crear una nueva solicitud.
 * Contiene propiedades para el tipo de solicitud, fechas y motivo.
 * Utiliza class-validator para validar los datos de entrada.
 * @property {TipoSolicitud} tipo - Tipo de solicitud (VACACIONES, ENFERMEDAD, PERMISO, ASUNTOS_PROPIOS).
 * @property {string} fechaInicio - Fecha de inicio de la solicitud (formato ISO 8601).
 * @property {string} fechaFin - Fecha de fin de la solicitud (formato ISO 8601).
 * @property {string} [motivo] - Motivo de la solicitud (opcional, mínimo 5 caracteres).
 * @uses class-validator para validación de datos.
 * 
 */

export class CreateSolicitudDto {
  @IsEnum(TipoSolicitud) // Validar que el tipo es uno de los definidos en el enum
  tipo: TipoSolicitud; // Tipo de solicitud

  @IsDateString() // Validar formato de fecha ISO 8601
  fechaInicio: string; // Fecha de inicio de la solicitud

  @IsDateString() // Validar formato de fecha ISO 8601
  fechaFin: string; // Fecha de fin de la solicitud

  @IsOptional() // Motivo es opcional
  @IsString() // Debe ser una cadena de texto
  @MinLength(5) // Mínimo 5 caracteres si se proporciona
  motivo?: string; // Motivo de la solicitud
}