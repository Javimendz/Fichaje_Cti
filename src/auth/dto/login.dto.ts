import { IsEmail, IsPhoneNumber, IsString } from "class-validator";

// dto/login.dto.ts
export class LoginDto {
  @IsPhoneNumber('ES') // mismo formato que el registro
  telefono: string;

  @IsString()
  password: string;
}