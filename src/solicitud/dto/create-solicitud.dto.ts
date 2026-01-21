import { IsEnum, IsDateString, IsString, IsOptional, MinLength } from 'class-validator';
import { TipoSolicitud } from '../entities/solicitud.entity';

export class CreateSolicitudDto {
  @IsEnum(TipoSolicitud)
  tipo: TipoSolicitud;

  @IsDateString()
  fechaInicio: string;

  @IsDateString()
  fechaFin: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  motivo?: string;
}