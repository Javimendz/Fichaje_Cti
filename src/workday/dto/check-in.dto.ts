import { IsNumber,  Min, Max } from 'class-validator';


// CheckInDto
// DTO para el check-in y check-out de jornadas laborales. Contiene latitud y longitud con validaciones para asegurar que los valores estén dentro de rangos geográficos válidos. Se utiliza para registrar la ubicación del usuario al iniciar o finalizar su jornada laboral.
/**
 * * * * CheckInDto
 * * DTO para el check-in y check-out de jornadas laborales. Contiene latitud y longitud con validaciones para asegurar que los valores estén dentro de rangos geográficos válidos. Se utiliza para registrar la ubicación del usuario al iniciar o finalizar su jornada laboral.
 * 
 */ 
export class CheckInDto {

  @IsNumber({}, { message: 'La latitud debe ser un número' })
  @Min(-90, { message: 'La latitud mínima es -90' })
  @Max(90, { message: 'La latitud máxima es 90' })
  latitud: number;

  
  @IsNumber({}, { message: 'La longitud debe ser un número' })
  @Min(-180, { message: 'La longitud mínima es -180' })
  @Max(180, { message: 'La longitud máxima es 180' })
  longitud: number;
}