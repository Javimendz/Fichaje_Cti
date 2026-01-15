import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from "@nestjs/common";
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
import { AllowedUser } from "allowed-user/entities/allowed-user.entity";

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly allowedPhonesService: AllowedPhonesService,
    @InjectRepository(AllowedUser)
    private readonly allowedUserRepository: Repository<AllowedUser>,
  ) {}

  // =====================================
  // LOGIN PRINCIPAL: DNI + Password
  // (Para Admin y Superadmin)
  // =====================================
  async login(loginDto: LoginDto) {
    const { dni, password } = loginDto;

    if (!dni || !password) {
      throw new BadRequestException('DNI y contraseña son requeridos');
    }

    // 1. Buscamos al usuario por DNI
    const user = await this.userRepository.findOne({ 
      where: { dni: dni.trim() },
      relations: ['empresa'] 
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2. Restricción de Rol (Los Workers suelen entrar por OTP)
    if (user.rol === UserRole.WORKER) {
      throw new UnauthorizedException(
        'Acceso denegado. Los trabajadores deben validar su identidad vía OTP.'
      );
    }

    // 3. Validación de Password
    if (!user.password) {
      throw new UnauthorizedException('El usuario no tiene una contraseña configurada');
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 4. Generación de Token
    // Si es Superadmin, empresaId será null automáticamente
    const payload = { 
      sub: user.id,
      dni: user.dni,
      rol: user.rol,
      empresaId: user.empresa?.id || null 
    };
    
    return { 
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nombre: user.nombre,
        rol: user.rol,
        empresaId: user.empresa?.id || null
      }
    };
  }

  // =====================================
  // WORKER: Solicitar OTP (Opcional)
  // =====================================
  async create(createUserDto: CreateUserDto) {
    const { telefono } = createUserDto;

    const allowedUser = await this.allowedUserRepository.findOne({ 
      where: { telefono, isActive: true },
      relations: ['empresa'] 
    });

    if (!allowedUser) {
      throw new UnauthorizedException('Este número no está autorizado por ninguna empresa.');
    }

    let user = await this.userRepository.findOne({ where: { telefono } });

    if (!user) {
      user = this.userRepository.create({
        telefono: allowedUser.telefono,
        nombre: allowedUser.nombre ?? '',
        dni: allowedUser.dni ?? '',
        empresa: allowedUser.empresa,
        rol: UserRole.WORKER,
        isVerified: false,
      });
    }

    const codigo = this.generarCodigo();
    const fechaExpiracion = new Date(Date.now() + 5 * 60 * 1000);

    user.codigoOTP = { codigo, expiracion: fechaExpiracion };
    user.codigoExpiraEn = fechaExpiracion;

    await this.userRepository.save(user);
    console.log(`[SMS] Código para ${telefono}: ${codigo}`);
 
    return { message: 'Código enviado correctamente' };
  }

  // =====================================
  // WORKER: Verificar OTP (Opcional)
  // =====================================
  async verifyCode(dto: VerifyCodeDto) {
    const { telefono, codigo } = dto;

    const user = await this.userRepository.findOne({
      where: { telefono: telefono.trim() },
      relations: ['empresa'],
    });

    if (!user || !user.codigoOTP?.codigo) {
      throw new UnauthorizedException('No hay un código pendiente para este número');
    }

    if (user.codigoExpiraEn && user.codigoExpiraEn < new Date()) {
      throw new UnauthorizedException('El código ha expirado');
    }

    if (user.codigoOTP.codigo !== String(codigo).trim()) {
      throw new UnauthorizedException('Código incorrecto');
    }

    user.isVerified = true;
    user.codigoOTP = null;
    user.codigoExpiraEn = null;
    await this.userRepository.save(user);

    await this.allowedPhonesService.markUsed(telefono);

    const payload = {
      sub: user.id,
      dni: user.dni,
      rol: user.rol,
      empresaId: user.empresa?.id ?? null,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: { nombre: user.nombre, rol: user.rol }
    };
  }

  // =====================================
  // HELPERS
  // =====================================
  private generarCodigo(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async update(id: string, updateAuthDto: Partial<User>) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    Object.assign(user, updateAuthDto);
    return this.userRepository.save(user);
  }
}