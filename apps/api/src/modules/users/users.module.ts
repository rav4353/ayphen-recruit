import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

import { AvailabilityController } from './availability.controller';

@Module({
  controllers: [UsersController, AvailabilityController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }
