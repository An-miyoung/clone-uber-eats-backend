import { Body, Controller, Post } from '@nestjs/common';

@Controller('payment')
export class PaymentsController {
  @Post('/payments')
  processPaddlePayment(@Body() body) {
    console.log(body);
    return {
      ok: true,
    };
  }
}
