/* eslint-disable @typescript-eslint/no-unused-vars */
import { Resolver } from '@nestjs/graphql';
import { Payment } from './entities/payment.entity';
import { PaymentService } from './payment.service';
import { Query } from '@nestjs/common';

Resolver((of) => Payment);
export class PaymentResolver {
  constructor(private readonly paymentService: PaymentService) {}
}
