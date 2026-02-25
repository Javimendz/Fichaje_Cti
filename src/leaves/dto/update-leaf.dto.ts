import { PartialType } from '@nestjs/swagger';
import { CreateLeaveRangeDto } from './create-leaf.dto';

export class UpdateLeafDto extends PartialType(CreateLeaveRangeDto) {}
