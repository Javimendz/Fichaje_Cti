// src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 1. Si el endpoint no tiene @Roles, permitimos el acceso (público o solo JWT)
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();

    // 2. Seguridad: Si el JWT no cargó al usuario, bloqueamos por defecto
    if (!user || !user.rol) {
      throw new ForbiddenException('No se pudo verificar la identidad o el rol del usuario');
    }

    // 3. El SUPERADMIN es el "dios" del sistema
    if (user.rol === UserRole.SUPERADMIN) return true;

    // 4. Verificación estricta: ¿El rol del usuario está en la lista de permitidos?
    const hasRole = requiredRoles.includes(user.rol);
    
    if (!hasRole) {
      // 🚩 Log de seguridad interno (opcional)
      console.warn(`[SECURITY] Intento de acceso no autorizado: User ${user.id} con rol ${user.rol} intentó acceder a ruta protegida para ${requiredRoles}`);
      
      throw new ForbiddenException('No tienes permisos suficientes para acceder a este recurso');
    }

    return true;
  }
}