import { IsEnum, IsString, IsOptional } from 'class-validator';
import { SolicitudStatus } from '../entities/solicitud.entity';

export class RevisarSolicitudDto {
  @IsEnum([SolicitudStatus.APROBADA, SolicitudStatus.RECHAZADA])
  estado: SolicitudStatus;

  @IsOptional()
  @IsString()
  comentarioAdmin?: string;
}