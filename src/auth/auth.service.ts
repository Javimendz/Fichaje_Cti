import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {  Repository } from 'typeorm';

import { CreateUserDto } from "./dto/createUserDto";
import { VerifyCodeDto } from './dto/verify-code.dto'; 
import { JwtService } from "@nestjs/jwt";
import { UpdateAuthDto } from "./dto/update-auth.dto";
import { User } from "./entities/user.entity";
import { AllowedPhonesService } from "allowed-phones/allowed-phones.service";
import { UserRole } from "./roles.enum";

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
      throw new UnauthorizedException('Este número de teléfono no está autorizado');
    }

    let user = await this.userRepository.findOneBy({ telefono });

    if (!user) {
      user = this.userRepository.create({
        telefono,
        isVerified: false,
        rol: UserRole.WORKER,
        isActive: true,
      });
    }
    await this.allowedPhonesService.markUsed(telefono);
    // --- CORRECCIÓN AQUÍ ---
    const codigo = this.generarCodigo();
    const expiracion = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    // Asignamos el objeto completo a la propiedad que causaba el error
    user.codigoOTP = { 
      codigo: codigo, 
      expiracion: expiracion 
    };
    
    await this.userRepository.save(user);

    console.log('Código OTP:', codigo);
    return { message: 'Código enviado' };
  }

  async verifyCode(dto: VerifyCodeDto) {
    const { telefono, codigo } = dto;
    const user = await this.userRepository.findOne({ 
      where: { telefono },
      relations: ['empresa'] 
    });

    if (!user || !user.codigoOTP) throw new UnauthorizedException('Usuario o código no encontrado');
    
    // --- VALIDACIÓN CORREGIDA ---
    // Ahora accedemos a las propiedades internas del objeto codigoOTP
    const now = new Date();
    if (user.codigoOTP.expiracion < now) {
      throw new UnauthorizedException('Código expirado');
    }

    if (user.codigoOTP.codigo !== codigo) { 
      throw new UnauthorizedException('Código inválido');
    }

    user.isVerified = true;
    user.codigoOTP = null; // Limpiamos el objeto
    await this.userRepository.save(user);

    const payload = { 
      sub: user.id, 
      telefono: user.telefono, 
      rol: user.rol, 
      empresaId: user.empresa?.id || null 
    };

    return { access_token: this.jwtService.sign(payload) };
  }

  generarCodigo(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async update(id: string, updateAuthDto: UpdateAuthDto) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    Object.assign(user, updateAuthDto);
    return this.userRepository.save(user);
  }
}