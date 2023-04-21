/* eslint-disable @typescript-eslint/no-unused-vars */
import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { User } from '../entities/user.entity';
import { MutationOutput } from 'src/common/dtos/output.dto';

@InputType()
export class CreateAccountInput extends PickType(User, [
  'email',
  'role',
  'password',
]) {}

@ObjectType()
export class CreateAccountOutput extends MutationOutput {}
