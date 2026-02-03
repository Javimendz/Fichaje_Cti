import { IsDateString, IsBoolean, IsString, IsNotEmpty, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { UserDto } from 'auth/dto/user.dto';

export class AttendanceDto {
  @IsNumber()
  @IsOptional() // Normalmente el ID lo genera la DB, así que es opcional al crear
  @Expose()
  id: number;

  @IsDateString({}, { message: 'La fecha debe ser un formato ISO válido' })
  @IsNotEmpty()
  @Expose()
  fecha: Date;

  @IsBoolean()
  @IsNotEmpty()
  @Expose()
  presente: boolean;

  @IsString()
  @IsOptional() // El motivo no siempre es obligatorio (ej. si está presente)
  @Expose()
  motivo: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  usuarioId: string;

  @IsOptional()
  @ValidateNested() // Crucial para validar el objeto usuario si viene anidado
  @Type(() => UserDto)
  @Expose()
  usuario: UserDto;
}