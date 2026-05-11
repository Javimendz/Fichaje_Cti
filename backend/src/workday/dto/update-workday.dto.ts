import { PartialType } from '@nestjs/swagger';
import { CheckInDto } from './check-in.dto';

export class UpdateWorkdayDto extends PartialType(CheckInDto) {}