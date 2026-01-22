import { IsEnum, IsString, IsOptional } from 'class-validator';
import { SolicitudStatus } from '../entities/solicitud.entity';

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

export class RevisarSolicitudDto {
  @IsEnum([SolicitudStatus.APROBADA, SolicitudStatus.RECHAZADA]) // Solo se permiten estos dos estados
  estado: SolicitudStatus; // Estado de la solicitud después de la revisión

  @IsOptional() // Comentario es opcional
  @IsString() // Debe ser una cadena de texto
  comentarioAdmin?: string; // Comentario del admin sobre la revisión
}