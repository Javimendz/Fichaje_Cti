import { IsEnum, IsDateString, IsString, IsOptional, MinLength, IsNotEmpty, IsDate, MaxLength } from 'class-validator';
import { TipoSolicitud } from '../entities/request.entity';
import { Expose, Transform } from 'class-transformer';

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

export class CreateRequestDto {
  @IsNotEmpty({ message: 'El tipo de solicitud es obligatorio' })
  @IsEnum(TipoSolicitud, { 
    message: 'El tipo debe ser: VACACIONES, ENFERMEDAD, PERMISO o ASUNTOS_PROPIOS' 
  })
  @Expose()
  tipo: TipoSolicitud;

  @IsNotEmpty({ message: 'La fecha de inicio es obligatoria' })
  @IsDateString({}, { 
    message: 'La fecha de inicio debe tener un formato ISO válido (AAAA-MM-DD)' 
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Expose()
  fechaInicio: string;

@IsNotEmpty({ message: 'La fecha de fin es obligatoria' })
  @IsDateString({}, { 
    message: 'La fecha de fin debe tener un formato ISO válido (AAAA-MM-DD)' 
  })
  // Saneamiento: Elimina espacios accidentales
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Expose()
  fechaFin: string;


  @IsOptional()
  @IsString({ message: 'El motivo debe ser una cadena de texto' })
  @MinLength(5, { message: 'Si proporciona un motivo, debe tener al menos 5 caracteres' })
  @MaxLength(500, { message: 'El motivo es demasiado extenso (máximo 500 caracteres)' })
  // Saneamiento: Elimina espacios innecesarios y limpia el texto
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    // Limpia espacios al inicio/final y reduce múltiples espacios internos a uno solo
    return value.trim().replace(/\s+/g, ' ');
  })
  @Expose()
  motivo?: string;

  @IsOptional()
  @IsString()
  @Expose()
  nombre?: string;

  @IsOptional()
  @IsString()
  @Expose()
  apellidos?: string;
}