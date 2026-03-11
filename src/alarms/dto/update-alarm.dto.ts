import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAlarmDto {
  @IsBoolean({ message: 'El estado leída admin debe ser booleano' })
  @IsOptional()
  leidaAdmin?: boolean;

  @IsBoolean({ message: 'El estado leída worker debe ser booleano' })
  @IsOptional()
  leidaWorker?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'La nota de resolución es demasiado larga' })
  notaAdmin?: string; // Por si quieres que el admin explique por qué la cierra
}