import { PartialType } from '@nestjs/swagger';
import { CreateAllowedUserDto } from './create-allowed-user.dto';

export class UpdateAllowedUserDto extends PartialType(CreateAllowedUserDto) {}
