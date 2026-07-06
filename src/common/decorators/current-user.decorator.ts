import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../../app/auth/interfaces/auth-types';

interface RequestWithUser {
  user: JwtPayload;
}

export const CurrentUser = createParamDecorator(
  (
    data: keyof JwtPayload | undefined,
    ctx: ExecutionContext,
  ): JwtPayload | JwtPayload[keyof JwtPayload] => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    return data ? user[data] : user;
  },
);
