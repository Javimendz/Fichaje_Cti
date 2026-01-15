import { IsEmail, IsPhoneNumber, IsString } from "class-validator";

// dto/login.dto.ts
export class LoginDto {
  @IsString()
  dni: string;

  @IsString()
  password: string;
}