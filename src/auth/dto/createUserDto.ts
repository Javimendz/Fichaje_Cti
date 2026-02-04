

import { Expose } from 'class-transformer';
import { IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class CreateUserDto {

  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El teléfono es obligatorio' })
  @IsPhoneNumber('ES', { 
    message: 'El número de teléfono debe ser un formato válido de España (ej: +34 600 00 00 00 o 600000000)' 
  })
  @Expose()
  telefono: string;
}