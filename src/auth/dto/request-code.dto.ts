import { IsPhoneNumber } from 'class-validator';


// RequestCodeDto
/**
 * * * * RequestCodeDto
 *  * * DTO para solicitar un código de verificación. Contiene una propiedad para el número de teléfono, que es un campo obligatorio y debe ser un número de teléfono válido de España. Utiliza class-validator para validar los datos de entrada, asegurando que el número de teléfono cumpla con el formato requerido. Este DTO se utiliza en el proceso de autenticación para enviar un código de verificación al usuario, permitiendo así la autenticación basada en códigos enviados por SMS.
 * */
export class RequestCodeDto {
  @IsPhoneNumber('ES')
  telefono: string;
}