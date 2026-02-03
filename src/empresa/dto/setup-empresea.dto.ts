import { 
  IsNotEmpty, 
  IsString, 
  IsOptional, 
  IsEmail, 
  ValidateNested, 
  IsPhoneNumber, 
  Matches,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAdminDto } from 'users/dto/create-admin.dto';

export class SetupEmpresaDto {
  
  // ============================================
  // IDENTIFICACIÓN DE LA EMPRESA
  // ============================================
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la empresa es obligatorio' })
  nombreEmpresa: string;

  @IsOptional() 
  @IsString() 
  @Matches(/^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-Z]$/i, { message: 'El formato del CIF no es válido' })
  cif?: string;

  // ============================================
  // LOCALIZACIÓN COMPLETA
  // ============================================
  @IsOptional() 
  @IsString() 
  direccion?: string;

  @IsOptional() 
  @IsString() 
  poblacion?: string;

  @IsOptional() 
  @IsString() 
  provincia?: string;

  @IsOptional() 
  @IsString() 
  pais?: string;

  @IsOptional()
  @Matches(/^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/, { message: 'El código postal debe tener 5 dígitos válidos de España' })
  codigoPostal?: string;

  // ============================================
  // CONTACTO CORPORATIVO Y PERSONAL
  // ============================================
  @IsOptional() 
  @IsEmail({}, { message: 'El email corporativo no tiene un formato válido' }) 
  email?: string;

  @IsOptional() 
  @IsString() 
  nombreContacto?: string; 

  @IsOptional() 
  @IsPhoneNumber('ES', { message: 'El teléfono de contacto debe ser un número válido de España' }) 
  telefonoContacto?: string; 

  @IsOptional() 
  @IsPhoneNumber('ES', { message: 'El teléfono de la empresa debe ser un número válido de España' }) 
  telefonoEmpresa?: string; 

  // ============================================
  // ADMINISTRADOR (Objeto Anidado)
  // ============================================
  @IsObject()
  @IsNotEmpty({ message: 'Los datos del administrador son obligatorios para el setup' })
  @ValidateNested()
  @Type(() => CreateAdminDto) 
  admin: CreateAdminDto;
}