import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../roles.enum';

// Roles Decorator
export const ROLES_KEY = 'roles';

/**
 * Uso:
 * @Roles(UserRole.ADMIN) // Solo ADMIN puede acceder
 * @Roles(UserRole.USER, UserRole.ADMIN) // USER y ADMIN pueden acceder
 * 
 * Este decorador se utiliza para marcar los endpoints con los roles que tienen permiso para acceder a ellos. Luego, el RolesGuard leerá esta metadata para determinar si el usuario autenticado tiene el rol necesario para acceder al endpoint.   
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);