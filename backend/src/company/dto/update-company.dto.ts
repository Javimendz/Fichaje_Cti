import { PartialType } from '@nestjs/mapped-types';
import { CreateCompanyDto } from './create-company.dto';
import { IsInt, IsObject, IsOptional, IsString, Min, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateUserDto } from '../../users/dto/update-user.dto';

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {

@IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateUserDto)
  admin?: UpdateUserDto;


  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' }) // <-- Añade esto
  configPassword?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  daysArchiveIssues?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  daysArchiveRequests?: number;
}
