import { Test, TestingModule } from '@nestjs/testing';
import { GuestsService } from './guests.service';
import { describe, expect, it, beforeEach} from '@jest/globals';

describe('GuestsService', () => {
  let service: GuestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuestsService],
    }).compile();

    service = module.get<GuestsService>(GuestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
