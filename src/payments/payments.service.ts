import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import {
  CreatePaymentInput,
  CreatePaymentOutput,
} from './dtos/create-payment.dto';
import { Payment } from './entities/payment.entity';
import { GetPaymentsOutput } from './dtos/get-payments.dto';
import { error } from 'console';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
  ) {}

  async createPayment(
    owner: User,
    { transactionId, restaurantId }: CreatePaymentInput,
  ): Promise<CreatePaymentOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);
      if (!restaurant) {
        return {
          ok: false,
          error: '해당 레스토랑을 찾을 수 없습니다.',
        };
      }
      if (restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: '레스토랑 Owner 만이 접근할 수 있습니다..',
        };
      }
      await this.payments.save(
        this.payments.create({
          transactionId,
          user: owner,
          restaurant,
        }),
      );

      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: '결제에 실패했습니다.',
      };
    }
  }

  async getPayments(owner: User): Promise<GetPaymentsOutput> {
    try {
      const payments = await this.payments.find({ user: owner });
      return {
        ok: true,
        payments,
      };
    } catch {
      return {
        ok: false,
        error: '결제내역을 불러오는데 실패했습니다.',
      };
    }
  }
}
