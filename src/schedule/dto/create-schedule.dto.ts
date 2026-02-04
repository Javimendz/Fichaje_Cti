import { Expose, Transform, Type } from "class-transformer";
import { 
  IsArray, 
  IsDateString, 
  IsString, 
  ValidateNested, 
  IsNotEmpty, 
  ArrayMinSize, 
  IsEnum, 
  MaxLength,
  MinLength
} from "class-validator";
import { DistribucionDiaDto } from "./DistribucionDiaDto";
import { OneToMany } from "typeorm";
import { DistribucionDia } from "schedule/entities/distribucion-dia.entity";

// Definir un Enum para el tipo ayuda a que no escriban cualquier cosa
export enum HorarioTipo {
  ROTATIVO = 'ROTATIVO',
  FIJO = 'FIJO',
  PARTIDO = 'PARTIDO'
}

export class CreateHorarioDto {
  @IsNotEmpty({ message: 'El nombre del horario es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(3, { message: 'El nombre del horario es demasiado corto (mínimo 3 caracteres)' })
  @MaxLength(50, { message: 'El nombre del horario es demasiado largo (máximo 50 caracteres)' })
  // Saneamiento: Elimina espacios innecesarios al principio y al final
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Expose()
  nombre: string;

  @IsNotEmpty({ message: 'La fecha de inicio es obligatoria' })
  @IsDateString({}, { 
    message: 'La fecha de inicio debe tener un formato de fecha válido (AAAA-MM-DD)' 
  })
  // Saneamiento: Elimina espacios accidentales que podrían romper el parseo en el backend
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Expose()
  fechaInicio: string;

  @IsNotEmpty({ message: 'La fecha de fin es obligatoria' })
  @IsDateString({}, { 
    message: 'La fecha de fin debe tener un formato de fecha válido (AAAA-MM-DD)' 
  })
  // Saneamiento: Asegura que no haya espacios laterales que invaliden el string
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Expose()
  fechaFin: string;

  @IsNotEmpty({ message: 'El tipo de horario es obligatorio' })
  @IsEnum(HorarioTipo, { 
    message: 'El tipo de horario debe ser uno de los siguientes valores: ROTATIVO, FIJO o PARTIDO' 
  })
  @Expose()
  tipo: HorarioTipo;

  @IsArray({ message: 'Las distribuciones deben enviarse en formato de lista (array)' })
  @ArrayMinSize(1, { message: 'El horario debe tener al menos una distribución de día configurada' })
  @ValidateNested({ each: true })
  // Crucial: @Type le dice a class-transformer que cada elemento del array 
  // debe ser una instancia de DistribucionDiaDto
  @Type(() => DistribucionDiaDto)
  @Expose()
  distribuciones: DistribucionDiaDto[];
}