import { PartialType } from '@nestjs/swagger';
import { CreateJornadaDto } from './create-jornada.dto';

export class UpdateJornadaDto extends PartialType(CreateJornadaDto) {}
