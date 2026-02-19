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
  MinLength,
  IsOptional
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

/**
 * CreateHorarioDto
 * DTO para crear un nuevo horario. Contiene el nombre del horario, las fechas de inicio y fin, el tipo de horario y una lista de distribuciones por día. Utiliza class-validator para validar los datos de entrada y class-transformer para transformar y exponer las propiedades correctamente.
 * @property {string} nombre - El nombre del horario. Es obligatorio, debe ser una cadena de texto entre 3 y 50 caracteres, y se transforma para eliminar espacios innecesarios.
 * @property {string} fechaInicio - La fecha de inicio del horario. Es obligatorio, debe ser una cadena con formato de fecha (AAAA-MM-DD) y se transforma para eliminar espacios.
 * @property {string} fechaFin - La fecha de fin del horario. Es obligatorio, debe ser una cadena con formato de fecha (AAAA-MM-DD) y se transforma para eliminar espacios.
 * @property {HorarioTipo} tipo - El tipo de horario. Es obligatorio y debe ser uno de los valores definidos en el enum HorarioTipo (ROTATIVO, FIJO, PARTIDO).
 * @property {DistribucionDiaDto[]} distribuciones - Una lista de distribuciones por día para el horario. Es obligatorio, debe ser un array con al menos una distribución, y cada elemento del array debe ser una instancia válida de DistribucionDiaDto.
 * @uses class-validator para validación de datos y class-transformer para transformación y exposición de propiedades.
 * @example
 * ```typescript
 * const nuevoHorario: CreateHorarioDto = {
 * nombre: 'Horario de Verano',
 * fechaInicio: '2024-06-01',
 * fechaFin: '2024-09-30',  
 * tipo: HorarioTipo.FIJO,
 * distribuciones: [
 *  {
 *    diaSemana: DiaSemana.LUNES,
 *   horasDia: 8,
 *   franjas: [
 *    { inicio: '08:00', fin: '12:00', distribucionDiaId: 1 },
 *   { inicio: '13:00', fin: '17:00', distribucionDiaId: 1 }
 *  ]
 * },
 * {
 *   diaSemana: DiaSemana.MARTES,
 *  horasDia: 6,
 * franjas: [
 *   { inicio: '09:00', fin: '12:00', distribucionDiaId: 2 },
 *  { inicio: '14:00', fin: '17:00', distribucionDiaId: 2 }
 * ]
 * }
 * ]
 * };
 * ```
 */

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
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida (ej: 2026-08-15)' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @Expose()
  fechaFin?: string;

  @IsNotEmpty({ message: 'El tipo de horario es obligatorio' })
  @IsEnum(HorarioTipo, { 
    message: 'El tipo de horario debe ser uno de los siguientes valores: ROTATIVO, FIJO o PARTIDO' 
  })
  @Expose()
  tipo: HorarioTipo;

  @IsArray({ message: 'Las distribuciones deben enviarse en formato de lista (array)' })
  @ArrayMinSize(1, { message: 'El horario debe tener al menos una distribución de día configurada' })
  @ValidateNested({ each: true })
 
  @Type(() => DistribucionDiaDto)
  @Expose()
  distribuciones: DistribucionDiaDto[];
}