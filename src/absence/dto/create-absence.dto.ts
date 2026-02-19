import {  IsNotEmpty, IsString, IsDateString, IsOptional } from 'class-validator';



// El DTO CreateAbsenceDto se utiliza para validar los datos de entrada al crear una nueva ausencia. Contiene propiedades como tipo, fecha_inicio, fecha_fin y motivo, con validaciones para asegurar que los datos sean correctos antes de ser procesados por el servicio de ausencias.
/**
 * * * * CreateAbsenceDto
 * * * DTO para crear una nueva ausencia. Contiene propiedades como tipo, fecha_inicio, fecha_fin y motivo, con validaciones para asegurar que los datos sean correctos antes de ser procesados por el servicio de ausencias.
 * */
export class CreateAbsenceDto {
  @IsNotEmpty() // El tipo de ausencia es un campo obligatorio
  @IsString() // El tipo de ausencia debe ser una cadena de texto
  tipo: string;

  @IsNotEmpty()
  @IsDateString()
  fecha_inicio: string;

  @IsNotEmpty()
  @IsDateString()
  fecha_fin: string;

  @IsOptional() // El motivo de la ausencia es un campo opcional
  @IsString()
  motivo: string;
}