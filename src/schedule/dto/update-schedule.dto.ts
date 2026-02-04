import { PartialType } from '@nestjs/swagger';
import { CreateHorarioDto } from './create-schedule.dto';
import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

export class UpdateScheduleDto extends PartialType(CreateHorarioDto) {

  @IsNumber()
  @IsNotEmpty()
  horarioId: number;

}
