import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Si pasas un argumento como @GetUser('dni'), devuelve solo esa propiedad
    return data ? user?.[data] : user;
  },
);