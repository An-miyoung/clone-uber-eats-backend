import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Order } from '../entities/order.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class OrderUpdateInput extends PickType(Order, ['id']) {}

@ObjectType()
export class OrderUpdateOutput extends CoreOutput {}
