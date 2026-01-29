import { UserRole } from "auth/roles.enum";

export interface UserPayload {
  userId: number;
  dni: string;
  rol: UserRole;
  empresaId: number | null;
}