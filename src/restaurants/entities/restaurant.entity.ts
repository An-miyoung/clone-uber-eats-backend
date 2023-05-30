/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  RelationId,
} from 'typeorm';
import { Category } from './category.entity';
import { User } from 'src/users/entities/user.entity';
import { Dish } from './dish.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Payment } from 'src/payments/entities/payment.entity';

@InputType('RestaurantInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant extends CoreEntity {
  @Field((type) => String)
  @Column()
  @IsString()
  name: string;

  @Field((type) => String)
  @Column()
  @IsString()
  coverImg: string;

  @Field((type) => String)
  @Column()
  @IsString()
  address: string;

  @Field((type) => Category, { nullable: true })
  @ManyToOne((type) => Category, (category) => category.restaurants, {
    nullable: true,
    onDelete: 'SET NULL',
    eager: true,
  })
  category: Category;

  @Field((type) => User)
  @ManyToOne((type) => User, (user) => user.restaurants)
  owner: User;

  // owner 을 User 전부로 받지 않고 id 만 가져오는 경우
  @RelationId((restaurant: Restaurant) => restaurant.owner)
  ownerId: number;

  @Field((type) => [Dish])
  @OneToMany((type) => Dish, (dish) => dish.restaurant)
  menu: Dish[];

  @Field((type) => [Order])
  @OneToMany((type) => Order, (order) => order.restaurant)
  orders: Order[];

  @Field((type) => Boolean)
  @Column({ default: false })
  isPromoted: boolean;

  @Field((type) => Date, { nullable: true })
  @Column({ nullable: true })
  promotedUntil?: Date;
}
