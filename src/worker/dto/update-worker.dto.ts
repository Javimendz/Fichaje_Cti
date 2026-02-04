import { PartialType } from '@nestjs/swagger';
import { CreateWorkerDto } from './worker.dto';

export class UpdateWorkerDto extends PartialType(CreateWorkerDto) {}
