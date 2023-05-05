/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Category } from '../entities/category.entity';

@ObjectType()
export class AllCategorieOutput extends CoreOutput {
  @Field((type) => [Category], { nullable: true })
  categories?: Category[];
}
