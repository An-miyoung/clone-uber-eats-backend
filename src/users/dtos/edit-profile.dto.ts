/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  InputType,
  ObjectType,
  Field,
  PickType,
  PartialType,
} from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from '../entities/user.entity';

@InputType()
export class EditProfileInput extends PartialType(
  PickType(User, ['email', 'password']),
) {}

@ObjectType()
export class EditProfileOutput extends CoreOutput {
  @Field((type) => User, { nullable: true })
  user?: User;
}
