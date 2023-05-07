/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsNumber, IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import {
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToOne,
  RelationId,
} from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { Order } from 'src/orders/entities/order.entity';

@InputType('DishChoiceInputType', { isAbstract: true })
@ObjectType()
class DishChoice {
  @Field((type) => String)
  name: string;

  @Field((type) => Int, { nullable: true })
  extra?: number;
}

@InputType('DishOptionInputType', { isAbstract: true })
@ObjectType()
class DishOption {
  @Field((type) => String)
  name: string;

  @Field((type) => [DishChoice], { nullable: true })
  choices: DishChoice[];

  @Field((type) => Int, { nullable: true })
  extra?: number;
}

@InputType('DishInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Dish extends CoreEntity {
  @Field((type) => String)
  @Column()
  @IsString()
  name: string;

  @Field((type) => Int)
  @Column()
  @IsNumber()
  price: number;

  @Field((type) => String, { nullable: true })
  @Column({ nullable: true })
  @IsString()
  photo?: string;

  @Field((type) => String)
  @Column()
  @IsString()
  @Length(5, 140)
  description: string;

  @Field((type) => Restaurant)
  @ManyToOne((type) => Restaurant, (restaurant) => restaurant.menu, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  restaurant: Restaurant;

  // restaurnat 객체 전부를 받지 않고 id 만 가져오는 경우
  @RelationId((dish: Dish) => dish.restaurant)
  retaurantId: number;

  @Field((type) => [DishOption], { nullable: true })
  @Column({ type: 'json', nullable: true })
  options?: DishOption[];
}
