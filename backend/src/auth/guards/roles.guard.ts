// src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../roles.enum';


// El RolesGuard es un guard que se encarga de verificar si el usuario autenticado tiene los roles necesarios para acceder a un endpoint protegido. Utiliza el decorador @Roles para definir los roles requeridos en cada endpoint, y luego compara esos roles con el rol del usuario autenticado. Si el usuario no tiene el rol requerido, se lanza una excepción de ForbiddenException, indicando que el usuario no tiene permisos para realizar la acción solicitada. Este guard es fundamental para implementar la autorización basada en roles en el sistema, asegurando que solo los usuarios con los permisos adecuados puedan acceder a ciertos recursos o realizar ciertas acciones.
/**
 * * * * RolesGuard
 *  * * Es un guard que se encarga de verificar si el usuario autenticado tiene los roles necesarios para acceder a un endpoint protegido. Utiliza el decorador @Roles para definir los roles requeridos en cada endpoint, y luego compara esos roles con el rol del usuario autenticado. Si el usuario no tiene el rol requerido, se lanza una excepción de ForbiddenException, indicando que el usuario no tiene permisos para realizar la acción solicitada. Este guard es fundamental para implementar la autorización basada en roles en el sistema, asegurando que solo los usuarios con los permisos adecuados puedan acceder a ciertos recursos o realizar ciertas acciones.
 * */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si el endpoint no tiene el decorador @Roles, se permite el acceso
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    //  El SUPERADMIN siempre tiene acceso a todo
    if (user.rol === UserRole.SUPERADMIN) return true;

    //  Verificación de roles requeridos
    const hasRole = requiredRoles.includes(user.rol);
    
    if (!hasRole) {
      throw new ForbiddenException('No tienes permisos para realizar esta acción');
    }

    return true;
  }
}