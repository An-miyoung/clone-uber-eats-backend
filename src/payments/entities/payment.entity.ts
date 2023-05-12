/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';

@InputType('PaymentInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Payment extends CoreEntity {
  @Field((type) => Int)
  @Column()
  transactionId: number;

  @Field((type) => User)
  @ManyToOne((type) => User, (user) => user.payments)
  user: User;

  @RelationId((payment: Payment) => payment.user)
  userId: number;

  // user entity 안에는 OneToMany 관계의 payment 필드를 추가했지만
  // restaurant 의 경우 내부에 payment 를 가질 필요가 없어 restaurant entity 에는 만들지 않았다.
  // ManyToOne 관계는 OneToMany 가 상대편에 없어도 가능
  @Field((type) => Restaurant)
  @ManyToOne((type) => Restaurant, (restaurant) => restaurant)
  restaurant: Restaurant;

  @RelationId((payment: Payment) => payment.restaurant)
  restaurantId: number;
}
