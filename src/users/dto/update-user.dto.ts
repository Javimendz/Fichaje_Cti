import { PartialType } from '@nestjs/mapped-types';
import { CreateAdminDto } from './create-admin.dto';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateAdminDto) {
  // Al extender de CreateAdminDto, si este ya tiene password, no necesitas hacer nada.
  // Pero si no la tiene, agrégala aquí:
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}