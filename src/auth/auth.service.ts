import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";

import { JwtService } from "@nestjs/jwt";
import { AllowedPhonesService } from "allowed-phones/allowed-phones.service";

import { VerifyCodeDto } from "./dto/verify-code.dto";
import { LoginDto } from "./dto/login.dto";
import { UserRole } from "./roles.enum";
import { Worker } from "worker/entities/worker.entity";
import { User } from "users/entities/user.entity";

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly allowedPhonesService: AllowedPhonesService,
    @InjectRepository(Worker)
    private readonly allowedUserRepository: Repository<Worker>,
  ) {}

  // =====================================
  // LOGIN PRINCIPAL: DNI + Password
  // (Para Admin y Superadmin)
  // =====================================
  // auth.service.ts

async login(loginDto: LoginDto) {
  const { email, dni, password } = loginDto;

  if (!email && !dni) {
    throw new BadRequestException('Debe proporcionar email o dni');
  }

  const queryBuilder = this.userRepository.createQueryBuilder('user')
    .addSelect('user.password')
    .leftJoinAndSelect('user.empresa', 'empresa');

  if (email) {
    queryBuilder.where('LOWER(user.email) = :email', { email: email.trim().toLowerCase() });
  } else {
    // Usamos el operador ? para evitar errores si dni es undefined
    queryBuilder.where('UPPER(user.dni) = :dni', { dni: dni?.trim().toUpperCase() });
  }

  const user = await queryBuilder.getOne();

  if (!user) throw new UnauthorizedException('Credenciales inválidas');
  if (!user.isActive) throw new UnauthorizedException('Usuario inactivo');

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new UnauthorizedException('Credenciales inválidas');

  // Lógica de Tiempos
  const isAdmin = user.rol === UserRole.SUPERADMIN || user.rol === UserRole.ADMIN;
  const tiempoExpiracionString = isAdmin ? '12h' : '1h';
  const horasMilisegundos = (isAdmin ? 12 : 1) * 60 * 60 * 1000;
  const fechaExpiracion = new Date(Date.now() + horasMilisegundos);

  // Actualización rápida: solo el campo necesario
  await this.userRepository.update(user.id, { tokenExpiraEn: fechaExpiracion });

  // Generar Payload
  const payload = { 
    sub: user.id, 
    rol: user.rol, 
    // Solo incluimos empresaId si no es SuperAdmin y el ID existe
    ...(user.rol !== UserRole.SUPERADMIN && { empresaId: user.empresaId }) 
  };

  return {
    access_token: this.jwtService.sign(payload, { expiresIn: tiempoExpiracionString }),
    user: {
      id: user.id,
      nombre: user.nombre,
      rol: user.rol,
      identificadorUsado: email ? user.email : user.dni,
      ...(user.rol !== UserRole.SUPERADMIN && { empresaId: user.empresaId }),
      tokenExpiraEn: fechaExpiracion.toISOString(),
    }
  };
}
}