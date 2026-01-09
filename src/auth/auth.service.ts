import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";

import { JwtService } from "@nestjs/jwt";
import { AllowedPhonesService } from "allowed-phones/allowed-phones.service";

import { User } from "./entities/user.entity";
import { CreateUserDto } from "./dto/createUserDto";
import { VerifyCodeDto } from "./dto/verify-code.dto";
import { LoginDto } from "./dto/login.dto";
import { UserRole } from "./roles.enum";
import { CodigoAcceso } from '../codigo-acceso/entities/codigo-acceso.entity';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly allowedPhonesService: AllowedPhonesService,
  ) {}

  // -------------------------------
  // WORKER: Solicitar OTP
  // -------------------------------
  async create(createUserDto: CreateUserDto) {
    const { telefono } = createUserDto;

    const isAllowed = await this.allowedPhonesService.checkPhoneAllowed(telefono);
    if (!isAllowed) throw new UnauthorizedException('Número no autorizado o ya utilizado');

    let user = await this.userRepository.findOneBy({ telefono });

    if (!user) {
      user = this.userRepository.create({
        telefono,
        isVerified: false,
        rol: UserRole.WORKER,
        isActive: true,
        empresa: { id: isAllowed.empresaId } 
      });
    }

    const codigo = this.generarCodigo();
    const expiracion = new Date(Date.now() + 5 * 60 * 1000);
    
    user.codigoOTP = { codigo: codigo.toString(), expiracion };

    await this.userRepository.save(user);
    console.log(`[AUTH] Nuevo OTP generado para ${telefono}: ${codigo}`);

    return { message: 'Código enviado' };
  }

  // -------------------------------
  // WORKER: Verificar OTP (Cambio 1 Aplicado)
  // -------------------------------
// src/auth/auth.service.ts

// src/auth/auth.service.ts -> verifyCode()

async verifyCode(dto: VerifyCodeDto) {
  const { telefono, codigo } = dto;

  const user = await this.userRepository.findOne({
    where: { telefono: telefono.trim() },
    relations: ['empresa'],
  });

  if (!user) throw new UnauthorizedException('Usuario no encontrado');

  // --- EL TRUCO PARA REPARAR EL UNDEFINED ---
  let otpData = user.codigoOTP;
  
  // Si TypeORM nos devuelve un string en lugar de un objeto, lo convertimos
  if (typeof otpData === 'string') {
    try {
      otpData = JSON.parse(otpData);
    } catch (e) {
      console.error('Error parseando codigoOTP:', e);
    }
  }
  // ------------------------------------------

  console.log('[VERIFY] Datos procesados:', otpData);

  if (!otpData || !otpData.codigo) {
    throw new UnauthorizedException('No hay un código pendiente');
  }

  // Comparamos usando la variable procesada 'otpData'
  if (String(otpData.codigo).trim() !== String(codigo).trim()) {
    console.error(`[VERIFY] Fallo: BD[${otpData.codigo}] vs Input[${codigo}]`);
    throw new UnauthorizedException('Código inválido');
  }

  // Si pasa, limpiamos y guardamos
  user.isVerified = true;
  user.codigoOTP = null;
  await this.userRepository.save(user);
  
  await this.allowedPhonesService.markUsed(telefono);

  const payload = { 
    sub: user.id, 
    telefono: user.telefono, 
    rol: user.rol, 
    empresaId: user.empresa?.id || null 
  };

  return { access_token: this.jwtService.sign(payload) };
}



  // -------------------------------
  // ADMIN: Login con email + password
  // -------------------------------
  async login(loginDto: LoginDto) {
    const { telefono, password } = loginDto;

    const user = await this.userRepository.findOne({ 
      where: { telefono },
      relations: ['empresa'] 
    });

    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    if (user.rol === UserRole.WORKER) {
      throw new UnauthorizedException('Los trabajadores deben usar acceso por OTP');
    }

    if (!user.password) throw new UnauthorizedException('El usuario no tiene contraseña definida');
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Contraseña incorrecta');

    const payload = { 
      sub: user.id, 
      rol: user.rol,
      empresaId: user.empresa?.id || null 
    };
    
    return { access_token: this.jwtService.sign(payload) };
  }

  generarCodigo(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async update(id: string, updateAuthDto: Partial<User>) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    Object.assign(user, updateAuthDto);
    return this.userRepository.save(user);
  }
}