
// src/site/dto/create-site-incident.dto.ts
import { 
  IsString, 
  IsNotEmpty, 
  IsEnum, 
  IsOptional, 
  IsNumber, 
  IsUrl, 
  MinLength, 
  MaxLength 
} from 'class-validator';
import { IncidentSeverity, IncidentType } from '../../site/enums/issue-type.enum';


export class CreateIssueSiteDto {
  
  @IsNumber({}, { message: 'El ID de la obra debe ser un número válido' })
  @IsNotEmpty({ message: 'Debes especificar la obra (siteId)' })
  siteId: number;

  @IsEnum(IncidentType, { 
    message: 'El tipo debe ser: WEATHER, MATERIAL, EQUIPMENT, ACCIDENT, PLAN_ERROR o OTHER' 
  })
  @IsNotEmpty({ message: 'El tipo de incidencia es obligatorio' })
  type: IncidentType;

  @IsEnum(IncidentSeverity, { 
    message: 'La gravedad debe ser: LOW, MEDIUM o HIGH' 
  })
  @IsNotEmpty({ message: 'La gravedad es obligatoria' })
  severity: IncidentSeverity;

  @IsString()
  @IsNotEmpty({ message: 'La descripción no puede estar vacía' })
  @MinLength(10, { message: 'Por favor, describe el problema con al menos 10 caracteres' })
  @MaxLength(1000, { message: 'La descripción es demasiado larga' })
  description: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'El enlace de la imagen debe ser una URL válida' })
  evidenceUrl?: string; // Aquí guardarás el link a la foto de la incidencia
}