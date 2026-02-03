import { Type } from "class-transformer";
import { 
  IsArray, 
  IsDateString, 
  IsString, 
  ValidateNested, 
  IsNotEmpty, 
  ArrayMinSize, 
  IsEnum 
} from "class-validator";
import { DistribucionDiaDto } from "./DistribucionDiaDto";
import { OneToMany } from "typeorm";
import { DistribucionDia } from "schedules/entities/distribucion-dia.entity";

// Definir un Enum para el tipo ayuda a que no escriban cualquier cosa
export enum HorarioTipo {
  ROTATIVO = 'ROTATIVO',
  FIJO = 'FIJO',
  PARTIDO = 'PARTIDO'
}

export class CreateHorarioDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del horario es obligatorio' })
  nombre: string;

  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida (ISO8601)' })
  fechaInicio: string;

  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida (ISO8601)' })
  fechaFin: string;

  @IsEnum(HorarioTipo, { message: 'El tipo de horario debe ser: ROTATIVO, FIJO o PARTIDO' })
  tipo: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'El horario debe tener al menos una distribución de día' })
  @ValidateNested({ each: true })
  @OneToMany(() => DistribucionDia, (dist) => dist.horario, { cascade: true })
  @Type(() => DistribucionDiaDto) 
  distribuciones: DistribucionDiaDto[];
}