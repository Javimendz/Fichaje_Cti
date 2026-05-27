import { IsArray, IsNumber, IsNotEmpty } from 'class-validator';

export class ReasignarTrabajadoresDto {
  @IsArray({ message: 'workerIds debe ser un array de números' })
  @IsNumber({}, { each: true, message: 'Cada ID de trabajador debe ser un número válido' })
  @IsNotEmpty({ each: true })
  workerIds: number[];

  @IsNumber({}, { message: 'El nuevoHorarioId debe ser un número válido' })
  @IsNotEmpty({ message: 'El ID del nuevo horario es obligatorio' })
  nuevoHorarioId: number;
}