import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, Matches } from 'class-validator';


export class CreateEmpresaDto {
 
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la empresa es obligatorio' })
  @Transform(({ value }) => value?.trim().toUpperCase()) // "  acme sa " -> "ACME SA"
  nombre: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()) // "B-123.456" -> "B123456"
  // Validación básica de formato CIF/NIF español (Letra + 8 dígitos o 7+letra)
  @Matches(/^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-Z]$/i, { 
    message: 'El formato del CIF no es válido' 
  })
  cif?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  provincia?: string;

  @IsOptional()
  @IsString()
  poblacion?: string;

  @IsOptional()
  @IsString()
  pais?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email de contacto no tiene un formato válido' })
  email?: string;

@IsPhoneNumber('ES', { message: 'El teléfono debe ser un número válido de España' })
  @IsNotEmpty({ message: 'El teléfono de la empresa es obligatorio' })
  telefono: string;

  @IsString()
  @IsNotEmpty({ message: 'El código postal es obligatorio' })
  // Valida que sean exactamente 5 números (Formato España)
  @Matches(/^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/, { 
    message: 'El código postal debe ser un formato válido de España (5 dígitos)' 
  })
  codigoPostal: string;

}