

import { Expose } from 'class-transformer';
import { IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';


// CreateUserDto
/**
 * * * * CreateUserDto
 *  * * DTO para crear un nuevo usuario. Contiene propiedades para la identificación del usuario, como el teléfono, que es un campo obligatorio y debe ser un número de teléfono válido de España. Utiliza class-validator para validar los datos de entrada, asegurando que el teléfono sea una cadena de texto y cumpla con el formato requerido. Este DTO se utiliza en el proceso de registro de nuevos usuarios en el sistema, garantizando que se proporcionen los datos necesarios para la creación de la cuenta.
 * */
export class CreateUserDto {

  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El teléfono es obligatorio' })
  @IsPhoneNumber('ES', { 
    message: 'El número de teléfono debe ser un formato válido de España (ej: +34 600 00 00 00 o 600000000)' 
  })
  @Expose()
  telefono: string;
}