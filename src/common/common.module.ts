import { Global, Module } from '@nestjs/common';
import { PUB_SUB } from './commom.constant';
import { PubSub } from 'graphql-subscriptions';

export const pubsub = new PubSub();

@Global()
@Module({
  providers: [
    {
      provide: PUB_SUB,
      useValue: pubsub,
    },
  ],
  exports: [PUB_SUB],
})
export class CommonModule {}
