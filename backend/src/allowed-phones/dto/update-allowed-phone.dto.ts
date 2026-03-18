import { PartialType } from '@nestjs/swagger';
import { CreateAllowedPhoneDto } from './create-allowed-phone.dto';

export class UpdateAllowedPhoneDto extends PartialType(CreateAllowedPhoneDto) {}
