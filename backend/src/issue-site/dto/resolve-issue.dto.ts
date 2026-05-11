// src/site/dto/resolve-issue.dto.ts

import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ResolveIssueDto {
  @IsString()
  @IsNotEmpty({ message: 'La nota de resolución es obligatoria' })
  @MinLength(10, { message: 'Por favor, explica con un poco más de detalle cómo se resolvió' })
  resolutionNote: string;
}