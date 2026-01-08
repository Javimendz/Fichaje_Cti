import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { CreateUserDto } from './dto/createUserDto';
import { LoginDto } from './dto/login.dto';

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

 @Post('login')
async login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto);
}

  // Este es el endpoint para verificar el código y obtener el JWT
  // POST http://localhost:3000/api/auth/verify
  @Post('verify')
  async verify(@Body() verifyCodeDto: VerifyCodeDto) {
    return this.authService.verifyCode(verifyCodeDto);
  }
 
}