import { IsEnum, IsString, IsOptional, MinLength, MaxLength, IsNotEmpty } from 'class-validator';

import { Expose, Transform } from 'class-transformer';

/**
 * RevisarSolicitudDto
 * DTO para revisar una solicitud.
 * Contiene propiedades para el estado de la solicitud y un comentario opcional del administrador.
 * Utiliza class-validator para validar los datos de entrada.
 * @property {SolicitudStatus} estado - Estado de la solicitud (APROBADA o RECHAZADA).
 * @property {string} [comentarioAdmin] - Comentario opcional del administrador sobre la revisión.
 * @uses class-validator para validación de datos.
 *  
 */
export enum RequestStatus {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
}


export class RevisarRequestDto {
  @IsNotEmpty({ message: 'El estado de la revisión es obligatorio' })
  // Limitamos explícitamente las opciones permitidas para la acción de revisar
  @IsEnum([RequestStatus.APROBADA, RequestStatus.RECHAZADA], { 
    message: 'El estado tras la revisión debe ser APROBADA o RECHAZADA' 
  })
  @Expose()
  estado: RequestStatus;


  
 @IsOptional()
  @IsString({ message: 'El comentario debe ser una cadena de texto' })
  // Filtro de calidad: Si el admin decide escribir, que al menos sea descriptivo
  @MinLength(3, { message: 'El comentario es demasiado corto' })
  @MaxLength(1000, { message: 'El comentario no puede exceder los 1000 caracteres' })
  // Saneamiento: Limpieza de espacios y normalización de texto
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    return value.trim().replace(/\s+/g, ' ');
  })
  @Expose()
  comentarioAdmin?: string;
}