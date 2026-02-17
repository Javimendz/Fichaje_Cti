import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserPayload } from 'auth/interfaces/user-payload.interface';


// GetUser Decorator
/**
 * * * * * GetUser
 * * * Decorador personalizado para extraer el usuario autenticado de la solicitud. Utiliza createParamDecorator de NestJS para crear un decorador que accede al objeto request y devuelve el usuario que ha sido previamente validado y adjuntado por el JwtAuthGuard. Este decorador permite a los controladores acceder fácilmente a la información del usuario autenticado, como su ID, email, rol, etc., sin tener que repetir la lógica de extracción del usuario en cada endpoint. Además, acepta un parámetro opcional que permite obtener una propiedad específica del usuario, lo que facilita aún más el acceso a los datos del usuario en los controladores.
 * 
 */

export const GetUser = createParamDecorator(
  (data: keyof UserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user; // Este es el objeto que retorna JwtStrategy.validate()

    
    return data ? user?.[data] : user;
  },
);