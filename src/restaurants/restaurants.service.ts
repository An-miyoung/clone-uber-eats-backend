import { Injectable } from '@nestjs/common';
import { Restaurant } from './entities/restaurant.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { User } from 'src/users/entities/user.entity';
import { Category } from './entities/category.entity';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import { CategoryRepository } from './repositories/category.repository';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { AllCategorieOutput } from './dtos/all-catgories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';

// 실제 데이터에 접근하는 함수들을 모음.
@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(Category)
    private readonly categories: CategoryRepository,
  ) {}

  async validationErrorCheck(
    owner: User,
    restaurantId: number,
  ): Promise<CoreOutput> {
    // findOneOrFail 을 사용하면 restaurnat 계정이 없으면 throw Error()을 실행해서 catch 로 빠져 error 핸들링이 된다.
    // findOne 을 사용하면 if (!restaurnat) {에러처리} 를 따로 해야 한다.
    const restaurant = await this.restaurants.findOne(restaurantId, {
      loadRelationIds: true,
    });
    if (!restaurant) {
      return {
        ok: false,
        error: '존재하지 않는 레스토랑 계정입니다.',
      };
    }
    // resolver 에서 보내는 owner 는 User 형태로 전부가 들어있고
    // restaurant 를 찾으며 loadRelationIds 로 찾은 restaurant.owner 는 id 만 들어있다.
    // 이 문제를 해결하기 위해 entity 안에 @RelationId 라는 데코레이터를 사용해 ownwerId 를 만든다.
    if (owner.id !== restaurant.ownerId) {
      return {
        ok: false,
        error: '레스토랑 계정은 owner 만 권한이 있습니다.',
      };
    }
  }

  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = this.restaurants.create(createRestaurantInput);
      newRestaurant.owner = owner;
      const category = await this.categories.getOrCreate(
        createRestaurantInput.categoryName,
      );
      newRestaurant.category = category;
      await this.restaurants.save(newRestaurant);
      return {
        ok: true,
      };
    } catch (error) {
      return { ok: false, error: '새로운 레스토랑계정을 만들지 못했습니다.' };
    }
  }

  async editRestaurant(
    owner: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    try {
      this.validationErrorCheck(owner, editRestaurantInput.restaurantId);
      let category: Category = null;
      if (editRestaurantInput.categoryName) {
        category = await this.categories.getOrCreate(
          editRestaurantInput.categoryName,
        );
      }

      await this.restaurants.save([
        {
          id: editRestaurantInput.restaurantId,
          ...editRestaurantInput,
          ...(category && { category }),
        },
      ]);
      return {
        ok: true,
      };
    } catch (error) {
      return { ok: false, error: '레스토랑 계정을 수정할 수 없습니다.' };
    }
  }

  async deleteRestaurant(
    owner: User,
    { restaurantId }: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    try {
      this.validationErrorCheck(owner, restaurantId);
      await this.restaurants.delete(restaurantId);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: '레스토랑계정을 삭제하는데 실패했습니다.' };
    }
  }

  async allCategories(): Promise<AllCategorieOutput> {
    try {
      const categories = await this.categories.find();
      return { ok: true, categories };
    } catch (error) {
      return { ok: false, error: '카테고리목록을 읽어 오는데 실패했습니다.' };
    }
  }

  async countRestaurant(category: Category): Promise<number> {
    try {
      return await this.restaurants.count({ category });
    } catch (error) {
      console.log(error.message);
      return null;
    }
  }

  async findCategoryByslug({ slug }: CategoryInput): Promise<CategoryOutput> {
    try {
      const category = await this.categories.findOne(
        { slug: slug },
        {
          relations: ['restaurants'],
        },
      );
      if (!Category) {
        return {
          ok: false,
          error: '해당 카테고리가 없습니다.',
        };
      }

      return {
        ok: true,
        category,
      };
    } catch (error) {
      return { ok: false, error: '해당 카테고리를 읽어오는데 실패했습니다.' };
    }
  }
}
