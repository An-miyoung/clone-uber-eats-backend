import { Module } from '@nestjs/common';
import { RestaurantsResolver } from './restaurants.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurants.service';
import { Category } from './entities/category.entity';

@Module({
  // restaourant repository 를 import
  imports: [TypeOrmModule.forFeature([Restaurant, Category])],
  // restaourant repository 에 대한 접근 함수는 RestaurantService 에서
  // 사용자요구처리 함수는 RestaurantResolver에서
  providers: [RestaurantsResolver, RestaurantService],
})
export class RestaurantsModule {}
