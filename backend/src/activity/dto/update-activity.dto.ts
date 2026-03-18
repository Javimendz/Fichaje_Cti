import { PartialType } from '@nestjs/swagger';
import { CreateActividadDto } from './create-activity.dto';

export class UpdateActivityDto extends PartialType(CreateActividadDto   ) {}
