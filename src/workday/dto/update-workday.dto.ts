import { PartialType } from '@nestjs/swagger';
import { CheckInDto } from './check-in.dto';

export class UpdateJornadaDto extends PartialType(CheckInDto) {}