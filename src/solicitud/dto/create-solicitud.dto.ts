import { IsEnum, IsDateString, IsString, IsOptional, MinLength, IsNotEmpty, IsDate } from 'class-validator';
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
  @IsEnum(TipoSolicitud, { 
    message: 'El tipo debe ser: VACACIONES, ENFERMEDAD, PERMISO o ASUNTOS_PROPIOS' 
  })
  tipo: TipoSolicitud;

  @IsDateString({}, { message: 'La fecha de inicio debe tener un formato ISO válido' })
fechaInicio: string;

@IsDateString({}, { message: 'La fecha de fin debe tener un formato ISO válido' })
fechaFin: string;


  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'El motivo debe tener al menos 5 caracteres' })
  motivo?: string;
}