import { 
  IsNotEmpty, 
  IsString, 
  IsDateString, 
  IsOptional, 
  IsEnum, 
  MinLength, 
  MaxLength 
} from 'class-validator';
import { Transform, Expose } from 'class-transformer';
import { TipoAusencia } from './ausencia-estado.enum';

// DTO para crear una nueva solicitud de ausencia. Incluye validaciones para asegurar que los datos ingresados sean correctos y consistentes, como el tipo de ausencia, las fechas de inicio y fin, y un motivo opcional con longitud limitada. Este DTO se utiliza en el controlador de ausencias para recibir y validar los datos enviados por los usuarios al crear una nueva solicitud de ausencia.
/**
 * * * * CreateAbsenceDto
 * DTO para crear una nueva solicitud de ausencia. Incluye validaciones para asegurar que los datos ingresados sean correctos y consistentes, como el tipo de ausencia, las fechas de inicio y fin, y un motivo opcional con longitud limitada. Este DTO se utiliza en el controlador de ausencias para recibir y validar los datos enviados por los usuarios al crear una nueva solicitud de ausencia.
 * * El campo tipo es obligatorio y debe ser uno de los valores definidos en el enum TipoAusencia (VACACIONES, ENFERMEDAD, PERMISO o ASUNTOS_PROPIOS). Las fechas de inicio y fin son obligatorias y deben estar en formato de fecha ISO (AAAA-MM-DD). El motivo es opcional pero si se proporciona, debe ser una cadena de texto con una longitud mínima de 5 caracteres y máxima de 500 caracteres. Además, se aplican transformaciones para limpiar espacios accidentales en las entradas de texto.
 * */

export class CreateAbsenceDto {
  @IsNotEmpty({ message: 'El tipo de ausencia es obligatorio' })
  @IsEnum(TipoAusencia, { 
    message: 'El tipo debe ser: VACACIONES, ENFERMEDAD, PERMISO u ASUNTOS_PROPIOS' 
  })
  @Expose()
  tipo: TipoAusencia;

  @IsNotEmpty({ message: 'La fecha de inicio es obligatoria' })
  @IsDateString({}, { message: 'Formato de fecha de inicio inválido (AAAA-MM-DD)' })
  @Transform(({ value }) => value?.trim()) // Limpia espacios accidentales
  @Expose()
  fecha_inicio: string;

  @IsNotEmpty({ message: 'La fecha de fin es obligatoria' })
  @IsDateString({}, { message: 'Formato de fecha de fin inválido (AAAA-MM-DD)' })
  @Transform(({ value }) => value?.trim())
  @Expose()
  fecha_fin: string;

  @IsOptional()
  @IsString({ message: 'El motivo debe ser una cadena de texto' })
  @MinLength(5, { message: 'El motivo es demasiado corto (mínimo 5 caracteres)' })
  @MaxLength(500, { message: 'El motivo no puede exceder los 500 caracteres' })
  @Transform(({ value }) => value?.trim().replace(/\s+/g, ' ')) // Limpia espacios extra
  @Expose()
  motivo?: string;
}