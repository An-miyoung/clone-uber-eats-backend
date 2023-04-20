import { Module } from '@nestjs/common';
import { RestaurantsResolver } from './restaurants.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurants.entity';
import { RestaurantService } from './restaurants.service';

@Module({
  // restaourant repository 를 import
  imports: [TypeOrmModule.forFeature([Restaurant])],
  // restaourant repository 에 대한 접근 함수는 RestaurantService 에서
  // 사용자요구처리 함수는 RestaurantResolver에서
  providers: [RestaurantsResolver, RestaurantService],
})
export class RestaurantsModule {}
