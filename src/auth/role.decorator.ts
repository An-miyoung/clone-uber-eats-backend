import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/users/entities/user.entity';

export type AlloedRoles = keyof typeof UserRole | 'Any';

export const Role = (roles: AlloedRoles[]) => SetMetadata('roles', roles);
