import { UserRole } from "auth/roles.enum";

export interface UserPayload {
  id: number;
  email: any;
  userId: number;
  dni: string;
  rol: UserRole;
  empresaId: number | null;
}