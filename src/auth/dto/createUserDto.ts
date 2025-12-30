

import { IsPhoneNumber } from 'class-validator';

export class CreateUserDto {

  
  @IsPhoneNumber('ES') 
  telefono: string;
}