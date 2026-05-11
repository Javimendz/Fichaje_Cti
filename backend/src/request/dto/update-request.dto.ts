import { PartialType } from '@nestjs/swagger';
import { CreateRequestDto } from './create-request.dto';
/**
 *  UpdateSolicitudDto
 *  DTO para actualizar una solicitud existente.
 * Extiende de CreateSolicitudDto para reutilizar las mismas propiedades.
 * No añade nuevas propiedades, pero permite actualizaciones parciales.
 * @see CreateRequestDto para las propiedades disponibles.
 * @uses PartialType para crear un DTO parcial basado en otro.
 * 
 * 
 */
export class UpdateRequestDto extends PartialType(CreateRequestDto) {}
