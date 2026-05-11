import { PartialType } from '@nestjs/swagger';
import { CreateIncidenciaDto } from './create-issue.dto';

export class UpdateIncidenciaDto extends PartialType(CreateIncidenciaDto) {}
