import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {  Repository } from 'typeorm';

import { CreateUserDto } from "./dto/createUserDto";
import { VerifyCodeDto } from './dto/verify-code.dto'; 
import { JwtService } from "@nestjs/jwt";
import { UpdateAuthDto } from "./dto/update-auth.dto";
import { User } from "./entities/user.entity";
import { AllowedPhonesService } from "allowed-phones/allowed-phones.service";

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
     private readonly userRepository: Repository<User>,
      private readonly jwtService: JwtService,
      private readonly allowedPhonesService: AllowedPhonesService,
  ) {}

  async create(createUserDto: CreateUserDto) {
  const { telefono } = createUserDto;
  
  const isAllowed = await this.allowedPhonesService.checkPhoneAllowed(telefono);
  if (!isAllowed) {
    throw new UnauthorizedException('Este número de teléfono no está autorizado para el registro');
  }

  // Buscar usuario existente
  let user = await this.userRepository.findOneBy({ telefono });

  if (!user) {
    user = this.userRepository.create({
      telefono,
      isVerified: false,
    });
  }

  const codigo = this.generarCodigo();
  user.codigoOTP = codigo;
  user.codigoExpiraEn = new Date(Date.now() + 5 * 60 * 1000); // 5 min
  await this.userRepository.save(user);

  console.log('Código OTP:', codigo);

  return { message: 'Código enviado' };
}


async update(id: string, updateAuthDto: UpdateAuthDto) {
  const user = await this.userRepository.findOneBy({ id });
  if (!user) throw new NotFoundException('Usuario no encontrado');

  Object.assign(user, updateAuthDto);
  return this.userRepository.save(user);
}


   generarCodigo(): string {
   return Math.floor(100000 + Math.random() * 900000).toString(); // 6 dígitos
  }



  async verifyCode(dto: VerifyCodeDto) {
  const { telefono, codigo } = dto;
  const user = await this.userRepository.findOneBy({ telefono });

  if (!user) throw new UnauthorizedException('Usuario no existe');
  
  // Validar expiración
  if (!user.codigoExpiraEn || user.codigoExpiraEn < new Date()) {
    throw new UnauthorizedException('Código expirado');
  }

  // VALIDACIÓN REAL
  if (user.codigoOTP !== codigo) { 
    throw new UnauthorizedException('Código inválido');
  }

  // Limpiar el código tras el uso (buena práctica)
  user.isVerified = true;
  user.codigoOTP = null; 
  await this.userRepository.save(user);

  const payload = { sub: user.id, telefono: user.telefono };
  return { access_token: this.jwtService.sign(payload) };
}


}

