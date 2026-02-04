import { IsBoolean, IsOptional, IsString, IsInt, IsNotEmpty, Min } from 'class-validator';

export class CreateAttendanceDto {
  

  @IsBoolean({ message: 'El campo presente debe ser un valor booleano' })
  presente: boolean;

  @IsString({ message: 'El motivo debe ser una cadena de texto' })
  @IsOptional()
  motivo?: string;
}