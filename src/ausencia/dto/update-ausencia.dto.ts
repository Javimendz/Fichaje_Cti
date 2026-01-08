import { PartialType } from '@nestjs/swagger';
import { CreateAusenciaDto } from './create-ausencia.dto';

export class UpdateAusenciaDto extends PartialType(CreateAusenciaDto) {}
