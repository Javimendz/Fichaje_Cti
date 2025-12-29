

import { IsPhoneNumber } from 'class-validator';

export class CreateUserDto {

  
  @IsPhoneNumber('ES') // cambia el país si es necesario
  telefono: string;
}