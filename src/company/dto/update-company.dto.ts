import { PartialType } from '@nestjs/mapped-types';
import { CreateCompanyDto } from './create-company.dto';
import { IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateUserDto } from 'users/dto/update-user.dto';

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {

@IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateUserDto)
  admin?: UpdateUserDto;

}
