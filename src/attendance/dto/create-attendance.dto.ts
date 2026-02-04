import { Expose, Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsInt, IsNotEmpty, Min, MinLength, MaxLength } from 'class-validator';

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