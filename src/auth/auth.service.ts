import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";

import { JwtService } from "@nestjs/jwt";
import { AllowedPhonesService } from "allowed-phones/allowed-phones.service";

import { VerifyCodeDto } from "./dto/verify-code.dto";
import { LoginDto } from "./dto/login.dto";
import { UserRole } from "./roles.enum";
import { AllowedUser } from "allowed-user/entities/allowed-user.entity";
import { User } from "users/entities/user.entity";

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
    const { email, dni, password } = loginDto;

    if (!email && !dni) {
      throw new BadRequestException('Debe proporcionar email o dni');
    }

    // 1. Construir la consulta con QueryBuilder para incluir la contraseña (select: false)
    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .addSelect('user.password') // <--- CAMBIO CLAVE: Traemos la pass explícitamente
      .leftJoinAndSelect('user.empresa', 'empresa'); // Opcional: traer relación empresa

    if (email) {
      queryBuilder.where('LOWER(user.email) = :email', { email: email.trim().toLowerCase() });
    } else {
      queryBuilder.where('UPPER(user.dni) = :dni', { dni: dni!.trim().toUpperCase() });
    }

    const user = await queryBuilder.getOne();

    // 2. Validaciones básicas
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    if (!user.isActive) throw new UnauthorizedException('Usuario inactivo');

    // 3. Comparar contraseña (user.password ahora sí existe)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Credenciales inválidas');

    // 4. Lógica de Tiempos
    const isAdmin = user.rol === UserRole.SUPERADMIN || user.rol === UserRole.ADMIN;
    const tiempoExpiracionString = isAdmin ? '12h' : '1h';
    const horasMilisegundos = (isAdmin ? 12 : 1) * 60 * 60 * 1000;
    const fechaExpiracion = new Date(Date.now() + horasMilisegundos);

    // 5. Actualizar la fecha de expiración en el usuario y GUARDAR
    user.tokenExpiraEn = fechaExpiracion;
    await this.userRepository.save(user);

    // 6. Generar Payload y Token
    // Usamos 'sub' para el ID del usuario como es estándar en JWT
    const isSuperAdmin = user.rol === UserRole.SUPERADMIN;
    const payload = { 
      sub: user.id, 
      rol: user.rol, 
      ...( !isSuperAdmin && { empresaId: user.empresaId } ) 
    };

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: tiempoExpiracionString }),
      user: {
        id: user.id,
        nombre: user.nombre,
        rol: user.rol,
        identificadorUsado: email ? user.email : user.dni,
        ...( !isSuperAdmin && { empresaId: user.empresaId } ),
        tokenExpiraEn: fechaExpiracion.toISOString(),
        expiresIn: tiempoExpiracionString
      }
    };
  }
}