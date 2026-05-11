import { UserRole } from "../../auth/roles.enum";

/// --- USER PAYLOAD ---
/**
 * * * UserPayload
 * * * Interfaz que define la estructura del objeto de usuario que se incluye en el token JWT y se utiliza en los decoradores GetUser para obtener los datos del usuario autenticado en los controladores. Esta interfaz incluye campos como id, email, userId, dni, rol y empresaId, que son esenciales para identificar al usuario y su relación con la empresa a la que pertenece. El UserPayload es fundamental para garantizar que los controladores puedan acceder a la información del usuario autenticado de manera segura y estructurada, permitiendo así implementar la lógica de negocio relacionada con la autenticación y autorización de usuarios en el sistema.
 * */
export interface UserPayload {
  id: number;
  email: any;
  userId: number;
  nombre: string;
apellido?: string | null;
  dni: string;
  rol: UserRole;
  empresaId: number;
}