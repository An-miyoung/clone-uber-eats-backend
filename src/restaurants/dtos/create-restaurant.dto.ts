/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, InputType, Int, ObjectType, PickType } from '@nestjs/graphql';
import { Restaurant } from '../entities/restaurant.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class CreateRestaurantInput extends PickType(Restaurant, [
  'name',
  'coverImg',
  'address',
]) {
  @Field((type) => String)
  categoryName: string;
}

@ObjectType()
export class CreateRestaurantOutput extends CoreOutput {
  // 최초에는 ok, error 외에는 받지 않았지만
  // 업주가 식당을 개설하고 다시 fetch 해서 자신의 계정을 보여줘야 하는 문제를 해결하기 위해
  // restaurant 정보를 받아와서 frontend 의 apollo cache 에 fake 로 써넣는다.
  @Field((type) => Int)
  restaurantId?: number;
}
