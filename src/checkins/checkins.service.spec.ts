import { Test, TestingModule } from '@nestjs/testing';
import { CheckinsService } from './checkins.service';

describe('CheckinsService', () => {
  let service: CheckinsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CheckinsService],
    }).compile();

    service = module.get<CheckinsService>(CheckinsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
