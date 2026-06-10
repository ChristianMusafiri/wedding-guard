import { Test, TestingModule } from '@nestjs/testing';
import { ScanController } from './scan.controller';
import { describe, expect, it, beforeEach} from '@jest/globals';

describe('ScanController', () => {
  let controller: ScanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScanController],
    }).compile();

    controller = module.get<ScanController>(ScanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
