import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AlloedRoles } from './role.decorator';
import { User } from 'src/users/entities/user.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly usersSrevice: UsersService,
  ) {}
  async canActivate(context: ExecutionContext) {
    // SetMataData 로 지정한 내용은 reflector 를 이용해 읽어올 수 있다.
    // 즉, resolver에서 Role decorator 를 이용해 metadata 로 넣어준 내용이 무엇인지
    // AuthGuard 에서 읽어와서 user 의 role과 맞춰보고 더 진행할지 막을지를 결정한다.
    const roles = this.reflector.get<AlloedRoles>(
      'roles',
      context.getHandler(),
    );
    // resolver 에서 각 사용자의 role을 metadata 에 넣는데, 아무것도 없다면 AuthGuard 를 pass시켜야 한다는 뜻
    // metadata 가 없다는 뜻은 계정이 아직 만들어지지 않은 경우로, createAccount, login 은 누구나 접근가능해야 한다.
    if (!roles) {
      return true;
    }
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const token = gqlContext.token;
    if (token) {
      const decoded = this.jwtService.verify(token.toString());
      if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
        const { user } = await this.usersSrevice.findUserById(decoded['id']);

        if (!user) {
          return false;
        }
        gqlContext['user'] = user;
        // role 이 'Any'라는 의미는 user 계정이 만들어진 모든 사용자가 접근할수 있는 resolver
        if (roles.includes('Any')) {
          return true;
        }
        // role이 있는 경우, 그 role 만 pass
        // roles 는 ["Owner"]과 같은 array 형태라 "Owner"와 직접 비교할 수 없으므로 포함하고 있는지 체크
        return roles.includes(user.role);
      }
    } else {
      return false;
    }
  }
}
