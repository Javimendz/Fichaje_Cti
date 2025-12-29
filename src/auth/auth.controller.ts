import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { CreateUserDto } from './dto/createUserDto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Solicitar OTP
  @Post('send-otp')
  sendOtp(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  // Verificar OTP
  @Post('verify-otp')
  verifyOtp(@Body() verifyCodeDto: VerifyCodeDto) {
    return this.authService.verifyCode(verifyCodeDto);
  }
}