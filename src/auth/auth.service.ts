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
  // WORKER: Solicitar OTP
  // =====================================
  async create(createUserDto: CreateUserDto) {
    const { telefono } = createUserDto;

    // 1. Buscar si el admin lo pre-registró
    const allowedUser = await this.allowedUserRepository.findOne({ 
      where: { telefono, isActive: true },
      relations: ['empresa', 'horario'] 
    });

    if (!allowedUser) {
      throw new UnauthorizedException('Este número no está autorizado. Contacta con tu empresa.');
    }

    // 2. Buscar si ya tiene cuenta o crear
    let user = await this.userRepository.findOne({ 
        where: { telefono },
        relations: ['empresa'] 
    });

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

    // 3. Generar OTP
    const codigo = this.generarCodigo();
    const fechaExpiracion = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    user.codigoOTP = {
      codigo: codigo,
      expiracion: fechaExpiracion,
    };
    user.codigoExpiraEn = fechaExpiracion;

    await this.userRepository.save(user);

    console.log(`[SMS SIMULATOR] Código enviado a ${telefono}: ${codigo}`);
 
    return { message: 'Código enviado correctamente' };
  }

  // =====================================
  // WORKER: Verificar OTP
  // =====================================
  async verifyCode(dto: VerifyCodeDto) {
    const { telefono, codigo } = dto;

    const user = await this.userRepository.findOne({
      where: { telefono: telefono.trim() },
      relations: ['empresa'],
    });

    console.log('--- DEBUG BASE DE DATOS ---');
    console.log('ID Usuario:', user?.id);
    console.log('Teléfono:', user?.telefono);
    console.log('Contenido Real de codigoOTP:', JSON.stringify(user?.codigoOTP));
    console.log('---------------------------');

    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    // 1️⃣ Verificar que exista OTP
    if (!user.codigoOTP || !user.codigoOTP.codigo) {
      throw new UnauthorizedException('No hay un código pendiente');
    }

    // 2️⃣ Verificar expiración
    if (user.codigoExpiraEn && user.codigoExpiraEn < new Date()) {
      throw new UnauthorizedException('Código expirado');
    }

    // 3️⃣ Comparación correcta
    if (user.codigoOTP.codigo !== String(codigo).trim()) {
      throw new UnauthorizedException('Código inválido');
    }

    // 4️⃣ Marcar verificado y limpiar
    user.isVerified = true;
    user.codigoOTP = null;
    user.codigoExpiraEn = null;
    await this.userRepository.save(user);

    // 5️⃣ Marcar en allowed-phones
    await this.allowedPhonesService.markUsed(telefono);

    // Generar JWT
    const payload = {
      sub: user.id,
      telefono: user.telefono,
      rol: user.rol,
      empresaId: user.empresa?.id ?? null,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        nombre: user.nombre,
        rol: user.rol
      }
    };
  }

  // =====================================
  // ADMIN: Login con email + password
  // =====================================
  async login(loginDto: LoginDto) {
    const { telefono, password } = loginDto;

    // Validar que se proporcionen ambos campos
    if (!telefono || !password) {
      throw new BadRequestException('Teléfono y contraseña son requeridos');
    }

    const user = await this.userRepository.findOne({ 
      where: { telefono },
      relations: ['empresa'] 
    });

    // 🔴 Si no existe el usuario
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 🔴 Si es WORKER, debe usar OTP
    if (user.rol === UserRole.WORKER) {
      throw new UnauthorizedException(
        'Los trabajadores deben usar acceso por OTP. Usa el endpoint /auth/request-otp'
      );
    }

    // 🔴 Si no tiene contraseña (no debería pasar)
    if (!user.password) {
      throw new UnauthorizedException('El usuario no tiene contraseña definida');
    }
    
    // 🔴 Verificar contraseña
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // ✅ Login exitoso
    const payload = { 
      sub: user.id,
      telefono: user.telefono,
      rol: user.rol,
      empresaId: user.empresa?.id || null 
    };
    
    return { 
      access_token: this.jwtService.sign(payload),
      user: {
        nombre: user.nombre,
        rol: user.rol
      }
    };
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