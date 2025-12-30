import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAllowedPhoneDto {
  @IsString()
  @IsNotEmpty()
  telefono: string;
}