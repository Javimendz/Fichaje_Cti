import { PartialType } from '@nestjs/swagger';
import { CreateCodigoAccesoDto } from './create-codigo-acceso.dto';

export class UpdateCodigoAccesoDto extends PartialType(CreateCodigoAccesoDto) {}
