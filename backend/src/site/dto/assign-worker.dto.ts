import { IsNumber, IsNotEmpty, IsArray } from 'class-validator';

export class AssignWorkerDto {
  @IsNumber()
  workerId: number;

  @IsArray() // 🚩 Ahora esperamos una lista
  @IsNumber({}, { each: true })
  siteIds: number[];
}