import { Expose, Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty,  MinLength, MaxLength } from 'class-validator';


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

  @MinLength(5, { message: 'El motivo debe ser más descriptivo (mínimo 5 caracteres)' })
    @MaxLength(255, { message: 'El motivo es demasiado largo (máximo 255 caracteres)' })
    @Expose()
    motivo?: string;
}