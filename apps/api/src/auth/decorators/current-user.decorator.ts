import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserSafe } from '@vitrine/shared';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserSafe => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
