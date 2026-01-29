import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAttendanceDto {
  @IsBoolean({ message: 'El campo presente debe ser un valor booleano' })
  presente: boolean;

  @IsString()
  @IsOptional()
  motivo?: string;

}