import { PartialType } from '@nestjs/swagger';
import { CreateAlgoDto } from './create-algo.dto';

export class UpdateAlgoDto extends PartialType(CreateAlgoDto) {}
