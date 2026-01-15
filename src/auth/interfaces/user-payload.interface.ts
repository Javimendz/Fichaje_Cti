import { UserRole } from "auth/roles.enum";

export interface UserPayload {
  userId: string;
  dni: string;
  rol: UserRole;
  empresaId: string | null;
}