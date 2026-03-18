import { PartialType } from '@nestjs/swagger';
import { CreateHorarioDto } from './create-schedule.dto';
import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

export class UpdateScheduleDto extends PartialType(CreateHorarioDto) {

  // Para actualizar un horario, necesitamos el ID del horario a modificar. Este campo es obligatorio para identificar qué registro se va a actualizar.
  
  @IsNumber()
  @IsNotEmpty()
  horarioId: number;

}
