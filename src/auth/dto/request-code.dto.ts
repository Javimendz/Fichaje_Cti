import { IsPhoneNumber } from 'class-validator';

export class RequestCodeDto {
  @IsPhoneNumber('ES')
  phone: string;
}