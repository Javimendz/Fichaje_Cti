import { IsString, Length } from 'class-validator';

export class LoginPinDto {
  @IsString()
  @Length(6, 6, { message: 'El PIN debe ser de 6 dígitos' })
  pin: string;
}