import { PartialType } from '@nestjs/swagger';
import { CreateHorarioDto } from './create-schedule.dto';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateScheduleDto extends PartialType(CreateHorarioDto) {

@IsUUID()
  @IsNotEmpty()
  horarioId: string;

}
