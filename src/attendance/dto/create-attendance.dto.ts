import { IsBoolean, IsOptional, IsString, IsInt, IsNotEmpty, Min } from 'class-validator';

export class CreateAttendanceDto {
  @IsInt({ message: 'El ID de usuario debe ser un número entero' })
  @Min(1, { message: 'El ID de usuario debe ser mayor a 0' })
  @IsNotEmpty({ message: 'El ID de usuario es obligatorio' })
  usuarioId: number; 

  @IsBoolean({ message: 'El campo presente debe ser un valor booleano' })
  presente: boolean;

  @IsString({ message: 'El motivo debe ser una cadena de texto' })
  @IsOptional()
  motivo?: string;
}