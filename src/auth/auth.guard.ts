import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AlloedRoles } from './role.decorator';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
    const roles = this.reflector.get<AlloedRoles>(
      'roles',
      context.getHandler(),
    );
    // resolver 에서 각 사용자의 role을 metadata 에 넣는데, 아무것도 없다면 AuthGuard 를 pass시켜야 한다는 뜻
    // role이 있는 경우, 그 role 만 pass
    if (!roles) {
      return true;
    }
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const user: User = gqlContext['user'];
    if (!user) {
      return false;
    }
    // roles 는 ["Owner"]과 같은 array 형태라 "Owner"와 직접 비교할 수 없으므로 포함하고 있는지 체크
    if (roles.includes('Any')) {
      return true;
    }
    return roles.includes(user.role);
  }
}
