/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';

@InputType('PaymentInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Payment extends CoreEntity {
  @Field((type) => Int)
  @Column()
  transactionId: number;

  @Field((type) => User, { nullable: true })
  @ManyToOne((type) => User, (user) => user.payments, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  user?: User;

  @RelationId((payment: Payment) => payment.user)
  userId: number;
}
