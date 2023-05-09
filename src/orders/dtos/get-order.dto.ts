/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { GetOrdersInput } from './get-orders.dto';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Order } from '../entities/order.entity';

@InputType()
export class GetOrderInput extends PickType(Order, ['id']) {}

@ObjectType()
export class GetOrderOutput extends CoreOutput {
  @Field((type) => Order, { nullable: true })
  order?: Order;
}
