import { IsDateString, IsBoolean, IsString, IsNotEmpty, IsNumber, IsOptional, ValidateNested, IsInt, Min, Matches, MinLength, MaxLength } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { AuthUserDto } from 'auth/dto/authUser.dto';

// DTO para crear o actualizar un registro de asistencia (Attendance)
/**
 * AttendanceDto
 * DTO para representar un registro de asistencia (fichaje) de un trabajador.
 * Contiene propiedades para la fecha, estado de presencia, motivo de ausencia (si aplica) y vinculación con el usuario.
 * Utiliza class-validator para validar los datos de entrada y class-transformer
 * para transformar y exponer los datos de manera adecuada en las respuestas de la API.
 * @property {number} [id] - ID del registro de asistencia (opcional, generado por la base de datos).
 * @property {string} fecha - Fecha del registro de asistencia (formato AAAA-MM-DD, obligatorio).
 * @property {boolean} presente - Indica si el trabajador está presente o ausente (obligatorio).
 * @property {string} [motivo] - Motivo de ausencia si el trabajador no está presente (opcional, mínimo 5 caracteres, máximo 255 caracteres).
 * @property {number} [usuarioId] - ID del usuario asociado al registro de asistencia (opcional, vinculado automáticamente al crear un nuevo registro).
 * @property {AuthUserDto} [usuario] - Información del usuario vinculado al registro de asistencia (opcional, solo para respuestas que incluyan datos del usuario).
 * Utiliza class-validator para validar los datos de entrada y class-transformer
 * para transformar y exponer los datos de manera adecuada en las respuestas de la API, asegurando que solo los campos relevantes sean visibles y que los datos estén en el formato correcto.
 * */ 

export class AttendanceDto {
  @IsNumber({}, { message: 'El ID debe ser un valor numérico' })
  @IsInt({ message: 'El ID debe ser un número entero' })
  @Min(1, { message: 'El ID debe ser un número positivo' })
  @IsOptional()
  @Expose()
  id?: number;

  @IsDateString({}, { 
    message: 'La fecha debe ser un formato válido (AAAA-MM-DD)' 
  })
  @IsNotEmpty({ message: 'La fecha es obligatoria' })
  @Expose()
  fecha: string;

  @IsBoolean({ message: 'El campo presente debe ser un valor booleano (true o false)' })
  @IsNotEmpty({ message: 'Debes indicar si el trabajador está presente' })
  // Esta transformación asegura que "true"/"false" en string se conviertan a boolean real
  @Transform(({ value }) => value === 'true' || value === true)
  @Expose()
  presente: boolean;

  @IsString()
  @IsOptional()
  // Permite: Letras, números, tildes, ñ, espacios y puntuación básica (.,-()/)
  @Matches(/^[a-zA-Z0-9à-ÿÀ-ßñÑ\s\.,\-\(\)\/]+$/, {
    message: 'El motivo contiene caracteres no permitidos',
  })
  @MinLength(5, { message: 'El motivo debe ser más descriptivo (mínimo 5 caracteres)' })
  @MaxLength(255, { message: 'El motivo es demasiado largo (máximo 255 caracteres)' })
  @Expose()
  motivo?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El ID de usuario debe ser un número válido' })
  @IsInt({ message: 'El ID de usuario debe ser un número entero' })
  @Min(1, { message: 'El ID de usuario debe ser un valor positivo' })
  @Expose()
  usuarioId?: number;

  @IsOptional()
  @ValidateNested({ message: 'Los datos del usuario vinculado no son válidos' })
  @Type(() => AuthUserDto) // Indica a class-transformer cómo instanciar el objeto
  @Expose() // Asegura que el campo sea visible durante la transformación
  usuario: AuthUserDto;
}