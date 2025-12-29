import { IsPhoneNumber, IsString, Length } from 'class-validator';

export class VerifyCodeDto {
  @IsPhoneNumber('ES') // mismo formato que el registro
  telefono: string;

  @IsString()
  @Length(6, 6, { message: 'El código debe tener 6 dígitos' })
  codigo: string;
}