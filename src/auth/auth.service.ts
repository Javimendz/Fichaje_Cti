import { Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";

import { JwtService } from "@nestjs/jwt";

import { LoginDto } from "./dto/login.dto";
import { UserRole } from "./roles.enum";
import { User } from "users/entities/user.entity";


/**
 * * * * AuthService
 *  * * Gestiona la autenticación de usuarios en el sistema. Contiene la lógica de negocio relacionada con la autenticación, como validar las credenciales de los usuarios, generar tokens JWT, y gestionar las sesiones de los usuarios a través de cookies. El servicio utiliza el UserRepository para acceder a los datos de los usuarios en la base de datos, el JwtService para generar y validar tokens JWT, y el AllowedPhonesService para validar los números de teléfono permitidos. Este servicio es fundamental para garantizar la seguridad del sistema y controlar el acceso a los recursos protegidos.
 * */
 
@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  // =====================================
  // LOGIN PRINCIPAL: DNI + Password
  // (Para Admin y Superadmin)
  // =====================================
  // auth.service.ts
  /**
   *  
   * @param loginDto DTO que contiene las credenciales de inicio de sesión (email o dni, y password). El método valida que se haya proporcionado al menos un identificador (email o dni), y luego busca el usuario en la base de datos utilizando el identificador proporcionado. Si el usuario no existe, está inactivo, o las credenciales son incorrectas, se lanzará una excepción de UnauthorizedException. Si las credenciales son correctas, se genera un token JWT con un payload que incluye el ID del usuario, su rol, y opcionalmente el ID de la empresa si el usuario no es un SuperAdmin. El token se firma con una clave secreta y tiene una expiración configurada según el rol del usuario (12 horas para Admins y SuperAdmins, 1 hora para Workers). El método devuelve un objeto que incluye el token JWT y los datos del usuario autenticado. 
   * @returns Un objeto que contiene el token JWT y los datos del usuario autenticado.
   * * Este método maneja el proceso de inicio de sesión de los usuarios. Recibe las credenciales del usuario a través del DTO LoginDto, y utiliza el UserRepository para buscar al usuario en la base de datos utilizando el email o dni proporcionado. Si el usuario no existe, está inactivo, o las credenciales son incorrectas, se lanzará una excepción de UnauthorizedException. Si las credenciales son correctas, se genera un token JWT con un payload que incluye el ID del usuario, su rol, y opcionalmente el ID de la empresa si el usuario no es un SuperAdmin. El token se firma con una clave secreta y tiene una expiración configurada según el rol del usuario (12 horas para Admins y SuperAdmins, 1 hora para Workers). El método devuelve un objeto que incluye el token JWT y los datos del usuario autenticado.
   * * Este método es fundamental para el proceso de autenticación en el sistema, ya que valida las credenciales de los usuarios y genera un token JWT que se utiliza para controlar el acceso a los recursos protegidos en el sistema. Además, la inclusión del ID de la empresa en el payload del token para usuarios que no son SuperAdmins permite implementar una lógica de autorización basada en la empresa a la que pertenece el usuario.
   * 
   * Nota: Si en el futuro decides permitir que los Admins también puedan iniciar sesión con su email, asegúrate de que el proceso de validación y generación del token se ajuste correctamente para manejar ambos casos (email y dni) sin afectar la seguridad ni la funcionalidad del sistema.
   */
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


// --- LOGOUT ---
/** 
 * * @param userId ID del usuario que cierra sesión. Este parámetro se puede utilizar para realizar cualquier limpieza adicional necesaria en el servidor, como invalidar tokens, actualizar el estado del usuario, o registrar la actividad de logout. En este ejemplo, simplemente se devuelve un mensaje de éxito junto con el ID del usuario que ha cerrado sesión.
 * * @returns Un objeto que contiene un mensaje de éxito indicando que la sesión se ha finalizado en el servidor, junto con el ID del usuario que ha cerrado sesión. Este método se puede expandir en el futuro para incluir lógica adicional relacionada con el proceso de logout, como invalidar tokens JWT, actualizar el estado del usuario en la base de datos, o registrar la actividad de logout para auditoría.
 * * Este método maneja el proceso de cierre de sesión de los usuarios en el servidor. Recibe el ID del usuario que cierra sesión, y devuelve un mensaje de éxito junto con el ID del usuario. En un entorno real, este método podría incluir lógica adicional para invalidar tokens JWT, actualizar el estado del usuario en la base de datos, o registrar la actividad de logout para auditoría. Sin embargo, en este ejemplo se mantiene simple para ilustrar el proceso básico de logout en el servidor.
 * */
async logout(userId: number) {
    return { 
      message: 'Sesión finalizada en servidor',
      userId 
    };
  }


}