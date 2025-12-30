import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../roles.enum';

export const ROLES_KEY = 'roles';

/**
 * Uso:
 * @Roles(UserRole.ADMIN)
 * @Roles(UserRole.USER, UserRole.ADMIN)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);