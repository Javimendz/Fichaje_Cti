import { PartialType } from '@nestjs/mapped-types';
import { CreateSiteLogDto } from './create-siteLog';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateSiteLogDto extends PartialType(CreateSiteLogDto) {


@IsDateString()
  @IsOptional()
  checkIn?: string; // Usamos string porque desde el JSON llega como texto ISO

  @IsDateString()
  @IsOptional()
  checkOut?: string;

  @IsString()
  @IsOptional()
  notes?: string;

}
