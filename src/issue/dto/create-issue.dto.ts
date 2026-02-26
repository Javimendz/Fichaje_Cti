import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { IncidenciaTipo } from '../entities/issue.entity';

export class CreateIncidenciaDto {
  @IsNotEmpty({ message: 'El tipo de incidencia es obligatorio' })
  @IsEnum(IncidenciaTipo, {
    message: 'El tipo de incidencia no es válido',
  })
  tipo: IncidenciaTipo;

  @IsString()
  @IsNotEmpty({ message: 'La descripción no puede estar vacía' })
  @MinLength(10, {
    message: 'La descripción debe tener mínimo 10 caracteres',
  })
  descripcion: string;
}
