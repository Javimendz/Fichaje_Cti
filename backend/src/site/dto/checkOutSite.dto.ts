// src/site/dto/check-out-site.dto.ts
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CheckOutSiteDto {
  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}