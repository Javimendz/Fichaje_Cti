import { Test, TestingModule } from '@nestjs/testing';
import { CheckinsController } from './checkins.controller';
import { CheckinsService } from './checkins.service';

describe('CheckinsController', () => {
  let controller: CheckinsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CheckinsController],
      providers: [CheckinsService],
    }).compile();

    controller = module.get<CheckinsController>(CheckinsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
