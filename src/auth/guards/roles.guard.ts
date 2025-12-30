import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtener roles requeridos del endpoint
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true; // Sin roles definidos = acceso abierto

    // Obtener usuario del request (llenado por AuthGuard)
    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.rol) return false;

    // ADMIN siempre tiene acceso
    if (user.rol.includes(UserRole.ADMIN)) return true;

    // Comprobar si el usuario tiene al menos un rol permitido
    return requiredRoles.some(role => user.rol.includes(role));
  }
}