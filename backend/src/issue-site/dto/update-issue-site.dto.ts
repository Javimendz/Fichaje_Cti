import { PartialType } from '@nestjs/mapped-types';
import { CreateIssueSiteDto } from './create-issue-site.dto';

export class UpdateIssueSiteDto extends PartialType(CreateIssueSiteDto) {}
