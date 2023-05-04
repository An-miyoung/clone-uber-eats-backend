import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/users/entities/user.entity';

export type AlloedRoles = keyof typeof UserRole | 'Any';
// metadata 는 resolver 의 extra data 이다.
export const Role = (roles: AlloedRoles[]) => SetMetadata('roles', roles);
