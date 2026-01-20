// src/empresas/dto/create-empresa-con-admin.dto.ts
import { IsEmail, IsNotEmpty, IsString, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AdminDataDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  dni: string;

  @IsString()
  @IsNotEmpty()
  telefono: string;
}

export class CreateEmpresaConAdminDto {
  @IsString()
  @IsNotEmpty()
  nombreEmpresa: string;

  @ValidateNested()
  @Type(() => AdminDataDto)
  admin: AdminDataDto;
}