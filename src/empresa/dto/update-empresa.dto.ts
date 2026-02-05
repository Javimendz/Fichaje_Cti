import { PartialType } from '@nestjs/mapped-types';
import { CreateEmpresaDto } from './create-empresa.dto';
import { IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateUserDto } from 'users/dto/update-user.dto';

export class UpdateEmpresaDto extends PartialType(CreateEmpresaDto) {

@IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateUserDto)
  admin?: UpdateUserDto;

}
