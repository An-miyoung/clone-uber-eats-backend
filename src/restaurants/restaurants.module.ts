import { Module } from '@nestjs/common';
import { CategoryResolver, RestaurantsResolver } from './restaurants.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurants.service';
import { CategoryRepository } from './repositories/category.repository';

@Module({
  // restaourant repository 를 import
  imports: [TypeOrmModule.forFeature([Restaurant, CategoryRepository])],
  // restaourant repository 에 대한 접근 함수는 RestaurantService 에서
  // 사용자요구처리 함수는 RestaurantResolver에서
  providers: [RestaurantsResolver, RestaurantService, CategoryResolver],
})
export class RestaurantsModule {}
