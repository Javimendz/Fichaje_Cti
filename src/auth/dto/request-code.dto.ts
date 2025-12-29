import { IsPhoneNumber } from 'class-validator';

export class RequestCodeDto {
  @IsPhoneNumber('ES')
  telefono: string;
}