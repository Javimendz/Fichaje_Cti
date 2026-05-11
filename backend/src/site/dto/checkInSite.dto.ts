// src/site/dto/check-in-site.dto.ts
import { IsNumber, IsNotEmpty, Min, Max, IsDateString } from 'class-validator';

export class CheckInSiteDto {
  @IsNumber()
  @IsNotEmpty()
  siteId: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsDateString()
  clientTimestamp: string;
}