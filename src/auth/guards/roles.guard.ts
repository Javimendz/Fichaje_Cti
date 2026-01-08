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

   // El SUPERADMIN suele tener acceso a todo
  if (user.rol === UserRole.SUPERADMIN) return true;

  // Validación estricta
  return requiredRoles.includes(user.rol);
  }
}