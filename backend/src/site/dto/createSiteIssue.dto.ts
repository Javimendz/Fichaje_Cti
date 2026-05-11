// src/site/dto/create-site-incident.dto.ts
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, IsUrl } from 'class-validator';
import {  IncidentSeverity, IncidentType } from '../enums/issue-type.enum';

export class CreateSiteIssueDto {
  @IsNumber()
  @IsNotEmpty()
  siteId: number;

  @IsEnum(IncidentType, { message: 'Tipo de incidencia no válido' })
  type: IncidentType;

  @IsEnum(IncidentSeverity, { message: 'Nivel de gravedad no válido' })
  severity: IncidentSeverity;

  @IsString()
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  description: string;

  @IsUrl({}, { message: 'La evidencia debe ser una URL válida' })
  @IsOptional()
  evidenceUrl?: string;
}