import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { OrderItem } from './entities/order-item.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItems: Repository<OrderItem>,
    @InjectRepository(Dish) private readonly dishes: Repository<Dish>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
  ) {}

  async createOrder(
    customer: User,
    { restaurantId, items }: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);
      if (!restaurant) {
        return { ok: false, error: '해당 레스토랑 계정을 찾을 수 없습니다.' };
      }

      let orderFinalPrice = 0;
      const orderItems: OrderItem[] = [];
      for (const item of items) {
        const dish = await this.dishes.findOne(item.dishId);
        if (!dish) {
          return { ok: false, error: '해당 메뉴를 찾을 수 없습니다.' };
        }

        let dishFinalPrice = dish.price;
        for (const itemOption of item.options) {
          const dishOption = dish.options.find(
            (dishOption) => dishOption.name === itemOption.name,
          );
          if (dishOption) {
            if (dishOption.extra) {
              dishFinalPrice += dishOption.extra;
            } else {
              const dishOptionChoice = dishOption.choices?.find(
                (optionChoice) => optionChoice.name === itemOption.choice,
              );
              if (dishOptionChoice) {
                if (dishOptionChoice.extra) {
                  dishFinalPrice += dishOptionChoice.extra;
                }
              }
            }
          }
        }
        orderFinalPrice += dishFinalPrice;
        const orderItem = await this.orderItems.save(
          this.orderItems.create({ dish, options: item.options }),
        );
        orderItems.push(orderItem);
      }
      await this.orders.save(
        this.orders.create({
          customer,
          restaurant,
          total: orderFinalPrice,
          items: orderItems,
        }),
      );
      return { ok: true };
    } catch {
      return { ok: false, error: '주문에 실패했습니다.' };
    }
  }

  async getOrders(
    user: User,
    { status }: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    try {
      let orders: Order[];
      // switch 문으로 변환하면 error 체크가 어렵다.
      if (user.role === UserRole.Client) {
        orders = await this.orders.find({
          where: {
            customer: user,
            ...(status && { status }),
          },
        });
      } else if (user.role === UserRole.Delivery) {
        orders = await this.orders.find({
          where: {
            driver: user,
            ...(status && { status }),
          },
        });
      } else if (user.role === UserRole.Owner) {
        const restaurants = await this.restaurants.find({
          where: {
            owner: user,
          },
          relations: ['orders'],
        });
        // owner 가 보유한 레스토랑의 갯수만큼 돌며 order 가 없는 레스토랑의 경우 빈 배열까지 붙여 놓기 때문에 flat 을 이용해 1 depth 내려가서 배열을 다시 만드다.
        orders = restaurants.map((restaurant) => restaurant.orders).flat(1);
        if (status) {
          orders = orders.filter((order) => order.status === status);
        }
      } else {
        return {
          ok: false,
          error: '사용자의 계정을 찾을 수 없습니다.',
        };
      }
      return {
        ok: true,
        orders,
      };
    } catch {
      return {
        ok: false,
        error: '주문을 가져오는데 실패했습니다.',
      };
    }
  }

  async getOrder(
    user: User,
    { id: orderId }: GetOrderInput,
  ): Promise<GetOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId, {
        relations: ['restaurant'],
      });
      if (!order) {
        return {
          ok: false,
          error: '해당 주문이 존재하지 않습니다.',
        };
      }
      // 본인과 관계된 오더만 가져올 수 있게 한다.
      let canSee = true;
      if (user.role === UserRole.Client && user.id !== order.customerId) {
        canSee = false;
      }
      if (user.role === UserRole.Delivery && user.id !== order.driverId) {
        canSee = false;
      }
      if (
        user.role === UserRole.Owner &&
        user.id !== order.restaurant.ownerId
      ) {
        canSee = false;
      }

      if (!canSee) {
        return {
          ok: false,
          error: '해당주문과 관련된 사람만 주문을 볼 수 있습니다.',
        };
      }
      return { ok: true, order };
    } catch {
      return { ok: false };
    }
  }
}
