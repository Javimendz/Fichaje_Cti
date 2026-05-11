import { PartialType } from '@nestjs/mapped-types';
import { CreateSiteDto } from './create-site.dto';
import { Site } from '../entities/site.entity';

export class UpdateSiteDto extends PartialType(CreateSiteDto) {}
