    import { Expose, Type } from 'class-transformer';
    import { AlarmType } from '../entities/alarm.entity';
    import { AuthUserDto } from 'auth/dto/authUser.dto'; // Reutilizamos el DTO de usuario
import { IsBoolean, IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

    export class AlarmDto {
    @Expose()
  @IsNumber({}, { message: 'El ID debe ser un número' })
  @IsOptional() // Opcional porque en creación el ID lo genera la DB
  id: number;

  @Expose()
  @IsEnum(AlarmType, { message: 'El tipo de alarma no es válido' })
  @IsNotEmpty({ message: 'El tipo de alarma es obligatorio' })
  tipo: AlarmType;

  @Expose()
  @IsString({ message: 'La descripción debe ser texto' })
  @IsNotEmpty({ message: 'La descripción no puede estar vacía' })
  descripcion: string;

  @Expose()
  @IsBoolean({ message: 'El estado de revisión debe ser booleano' })
  revisada: boolean;

  @Expose()
  @IsNumber({}, { message: 'El ID de empresa debe ser un número' })
  @IsNotEmpty({ message: 'El ID de empresa es obligatorio' })
  empresaId: number;

  @Expose()
  @Type(() => Date)
  @IsDate({ message: 'La fecha de creación debe ser una fecha válida' })
  createdAt: Date;

  // Validación de objeto anidado
  @Expose()
  @Type(() => AuthUserDto)
  @ValidateNested() // 🛡️ Crucial: Valida que el objeto usuario cumpla sus propias reglas
  @IsOptional()
  usuario: AuthUserDto;
    }