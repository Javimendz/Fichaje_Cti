import { PartialType } from '@nestjs/mapped-types';
import { CreateCompanyDto } from './create-company.dto';
import { IsInt, IsObject, IsOptional, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateUserDto } from 'users/dto/update-user.dto';

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {

@IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateUserDto)
  admin?: UpdateUserDto;


  @IsOptional()
  @IsInt()
  @Min(0)
  daysArchiveIssues?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  daysArchiveRequests?: number;
}
