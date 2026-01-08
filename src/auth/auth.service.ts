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

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly allowedPhonesService: AllowedPhonesService,
  ) {}

  // -------------------------------
  // WORKER: Solicitar OTP / Crear usuario temporal
  // -------------------------------
  async create(createUserDto: CreateUserDto) {
    const { telefono } = createUserDto;

    const isAllowed = await this.allowedPhonesService.checkPhoneAllowed(telefono);
    if (!isAllowed) throw new UnauthorizedException('Número no autorizado');

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

    // Generar OTP
    const codigo = this.generarCodigo();
    const expiracion = new Date(Date.now() + 5 * 60 * 1000); // 5 min
    user.codigoOTP = { codigo, expiracion };

    await this.userRepository.save(user);
    console.log('Código OTP generado para pruebas:', codigo);

    return { message: 'Código enviado' };
  }

  // -------------------------------
  // WORKER: Verificar OTP y generar JWT
  // -------------------------------
  async verifyCode(dto: VerifyCodeDto) {
    const { telefono, codigo } = dto;

    const user = await this.userRepository.findOne({
      where: { telefono },
      relations: ['empresa'],
    });

    if (!user || !user.codigoOTP)
      throw new UnauthorizedException('Usuario o código no encontrado');

    const now = new Date();
    if (user.codigoOTP.expiracion < now) throw new UnauthorizedException('Código expirado');
    if (user.codigoOTP.codigo !== codigo) throw new UnauthorizedException('Código inválido');

    // Limpiar OTP y marcar como verificado
    user.isVerified = true;
    user.codigoOTP = null;
    await this.userRepository.save(user);

    const payload = {
      sub: user.id,
      telefono: user.telefono,
      rol: user.rol,
      empresaId: user.empresa?.id || null,
    };

    return { access_token: this.jwtService.sign(payload) };
  }

  // -------------------------------
  // ADMIN: Login con email + password
  // -------------------------------
  async login(loginDto: LoginDto) {
  const { telefono, password } = loginDto;

  // 1. Buscamos asegurándonos de que sea un ADMIN o SUPERADMIN
  const user = await this.userRepository.findOne({ 
    where: { telefono },
    relations: ['empresa'] 
  });

  if (!user) throw new UnauthorizedException('Credenciales inválidas');

  // 2. Si es un Worker intentando entrar por login de Admin, lo rechazamos
  if (user.rol === UserRole.WORKER) {
    throw new UnauthorizedException('Los trabajadores deben usar acceso por OTP');
  }

  // 3. Verificación de password
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

  // -------------------------------
  // Helper: Generar código OTP
  // -------------------------------
  generarCodigo(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // -------------------------------
  // Actualizar usuario (opcional)
  // -------------------------------
  async update(id: string, updateAuthDto: Partial<User>) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    Object.assign(user, updateAuthDto);
    return this.userRepository.save(user);
  }
}
