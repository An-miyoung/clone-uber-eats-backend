import { Injectable } from '@nestjs/common';
import { Restaurant } from './entities/restaurant.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Raw, Repository } from 'typeorm';
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
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dto';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto';
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from './dtos/searchRestaurant.dto';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import { Dish } from './entities/dish.entity';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';

// 실제 데이터에 접근하는 함수들을 모음.
@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(Category)
    private readonly categories: CategoryRepository,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
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

  async findCategoryByslug({
    slug,
    page,
  }: CategoryInput): Promise<CategoryOutput> {
    try {
      const category = await this.categories.findOne({ slug: slug });
      if (!Category) {
        return {
          ok: false,
          error: '해당 카테고리가 없습니다.',
        };
      }

      const restaurants = await this.restaurants.find({
        where: {
          category,
        },
        // 한페이지당 몇개의 item 을 보여줄지
        take: 25,
        // 몇개 item 까지 스킵할것인가 계샨
        skip: (page - 1) * 25,
      });

      const totalResults = await this.countRestaurant(category);
      return {
        ok: true,
        restaurants,
        category,
        totalPages: Math.ceil(totalResults / 25),
      };
    } catch (error) {
      return { ok: false, error: '해당 카테고리를 읽어오는데 실패했습니다.' };
    }
  }

  async allRestaurants({ page }: RestaurantsInput): Promise<RestaurantsOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        skip: (page - 1) * 25,
        take: 25,
      });
      return {
        ok: true,
        results: restaurants,
        totalPages: Math.ceil(totalResults / 25),
        totalResults,
      };
    } catch (error) {
      return { ok: false, error: '레스토랑 목록을 가져오는데 실패했습니다.' };
    }
  }

  async findRestaurantById({
    restaurantId,
  }: RestaurantInput): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId, {
        relations: ['menu'],
      });
      if (!restaurant) {
        return { ok: false, error: '해당 레스토랑을 찾을 수 없습니다.' };
      }
      return {
        ok: true,
        restaurant,
      };
    } catch (error) {
      return { ok: false, error: '해당 레스토랑을 찾을 수 없습니다.' };
    }
  }

  async searchRestaurantByName({
    query,
    page,
  }: SearchRestaurantInput): Promise<SearchRestaurantOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        where: {
          // 레스토랑 이름 어디라도 query 내용이 있다면 찾을 수 있도록
          // name: Like(`%${query}%`) 을 사용하면, 대소문자를 구별한다. 사용자가 불편
          // sql 을 써서 db 에 직접 명령을 내리도록 Raw 사용
          name: Raw((name) => `${name} ILike '%${query}%'`),
        },
        skip: (page - 1) * 25,
        take: 25,
      });

      return {
        ok: true,
        restaurants,
        totalResults,
        totalPages: Math.ceil(totalResults / 25),
      };
    } catch {
      return { ok: false, error: '원하는 레스토랑을 찾을 수 없습니다.' };
    }
  }

  async createDish(
    owner: User,
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    try {
      const restaurant = await this.restaurants.findOne(
        createDishInput.restaurantId,
      );
      console.log(restaurant);
      if (!restaurant) {
        return { ok: false, error: '해당 레스토랑을 찾지 못했습니다.' };
      }
      if (owner.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: '해당 레스토랑의 owner 만 메뉴를 만들 수 있습니다.',
        };
      }
      // 인자로 restaurantId 를 줘도 dishes.create 에서 직접 연결해 가져가지 않는다.
      // 이런 형태로 { ...createDishInput, restaurant } 넣어줘야 한다.
      await this.dishes.save(
        this.dishes.create({ ...createDishInput, restaurant }),
      );

      // await this.restaurants.save({ menu: dish });
      return { ok: true };
    } catch {
      return { ok: false, error: '메뉴를 생성에 실패했습니다.' };
    }
  }

  async editDish(
    owner: User,
    editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    try {
      const dish = await this.dishes.findOne(editDishInput.dishId, {
        relations: ['restaurant'],
      });
      if (!dish) {
        return { ok: false, error: '해당메뉴를 찾을 수 없습니다.' };
      }

      if (owner.id !== dish.restaurant.ownerId) {
        return {
          ok: false,
          error: '해당 레스토랑의 owner 만 메뉴를 수정할 수 있습니다.',
        };
      }

      await this.dishes.save([
        {
          id: editDishInput.dishId,
          ...editDishInput,
        },
      ]);
      return { ok: true };
    } catch {
      return { ok: false, error: '메뉴 수정을 실패했습니다.' };
    }
  }

  async deleteDish(
    owner: User,
    { dishId }: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    try {
      const dish = await this.dishes.findOne(dishId, {
        relations: ['restaurant'],
      });
      if (!dish) {
        return { ok: false, error: '해당메뉴를 찾을 수 없습니다.' };
      }

      if (owner.id !== dish.restaurant.ownerId) {
        return {
          ok: false,
          error: '해당 레스토랑의 owner 만 메뉴를 삭제할 수 있습니다.',
        };
      }

      // const newRestaurant = { ...restaurant, }
      // this.restaurants.save([{id: dish.retaurantId, }])
      await this.dishes.delete(dishId);

      return { ok: true };
    } catch {
      return { ok: false, error: '메뉴를 삭제하는 데 실패했습니다.' };
    }
  }
}
