import { PartialType } from '@nestjs/swagger';
import { CreateFranjaHorariaDto } from './create-franja-horaria.dto';

export class UpdateFranjaHorariaDto extends PartialType(CreateFranjaHorariaDto) {}
