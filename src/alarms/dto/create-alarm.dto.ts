    import { Expose, Type } from 'class-transformer';
    import { AlarmType } from '../entities/alarm.entity';
    import { AuthUserDto } from 'auth/dto/authUser.dto'; // Reutilizamos el DTO de usuario
import { IsBoolean, IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

// CreateAlarmDto
// DTO para crear una nueva alarma. Incluye validaciones para asegurar que los datos ingresados sean correctos y consistentes, como el tipo de alarma, la descripción, el estado de revisión y el ID de empresa. Este DTO se utiliza en el controlador de alarmas para recibir y validar los datos enviados por los usuarios al crear una nueva alarma.
    /**
     * * * * AlarmDto
     * DTO para crear una nueva alarma. Incluye validaciones para asegurar que los datos ingresados sean correctos y consistentes, como el tipo de alarma, la descripción, el estado de revisión y el ID de empresa. Este DTO se utiliza en el controlador de alarmas para recibir y validar los datos enviados por los usuarios al crear una nueva alarma.     
*/
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
  @ValidateNested() 
  @IsOptional()
  usuario: AuthUserDto;
    }