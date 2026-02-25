import { Expose, Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty,  MinLength, MaxLength, IsString, ValidateIf, IsOptional, IsNumber } from 'class-validator';


// DTO para crear un nuevo registro de asistencia (fichaje) de un trabajador.
/**
 * CreateAttendanceDto
 * DTO para crear un nuevo registro de asistencia (fichaje) de un trabajador.
 * Contiene propiedades para el estado de presencia y el motivo de ausencia (si aplica).
 * Utiliza class-validator para validar los datos de entrada y class-transformer
 * para transformar y exponer los datos de manera adecuada en las respuestas de la API.
 * @property {boolean} presente - Indica si el trabajador está presente o ausente (obligatorio).
 *  @property {string} [motivo] - Motivo de ausencia si el trabajador no está presente (opcional, mínimo 5 caracteres, máximo 255 caracteres).
 * Utiliza class-validator para validar los datos de entrada y class-transformer
 * para transformar y exponer los datos de manera adecuada en las respuestas de la API, asegurando que solo los campos relevantes sean visibles y que los datos estén en el formato correcto.
 * */
export class CreateAttendanceDto {
  

   @IsBoolean({ message: 'El campo presente debe ser un valor booleano (true o false)' })
    @IsNotEmpty({ message: 'Debes indicar si el trabajador está presente' })
    // Esta transformación asegura que "true"/"false" en string se conviertan a boolean real
    @Transform(({ value }) => value === 'true' || value === true)
    @Expose()
    presente: boolean;

  @IsString({ message: 'El motivo debe ser texto' })
  @ValidateIf(o => o.presente === false)
  @IsNotEmpty({ message: 'Es obligatorio indicar un motivo si no estás presente' })
  @MinLength(5, { message: 'El motivo debe ser más descriptivo' })
  @MaxLength(255)
  @Expose()
  motivo?: string;

  @IsOptional()
  @IsNumber()
  lat?: number; 

  @IsOptional()
  @IsNumber()
  lng?: number;

}