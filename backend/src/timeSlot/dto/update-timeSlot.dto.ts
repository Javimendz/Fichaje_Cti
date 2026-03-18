import { PartialType } from '@nestjs/swagger';
import { CreateTimeSlotDto } from './create-timeSlot.dto';

export class UpdateTimeSlotDto extends PartialType(CreateTimeSlotDto) {}
