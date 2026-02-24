import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAlarmDto {
  @IsBoolean({ message: 'El estado de revisada debe ser un booleano' })
  @IsOptional()
  revisada?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'La nota de resolución es demasiado larga' })
  notaAdmin?: string; // Por si quieres que el admin explique por qué la cierra
}