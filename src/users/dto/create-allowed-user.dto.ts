import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class CreateAllowedUserDto {
  @IsString()
  @IsNotEmpty()
  telefono: string;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  dni?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}