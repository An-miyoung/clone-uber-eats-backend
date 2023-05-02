import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import { JwtService } from './jwt.service';
import { CONFIG_OPTIONS } from 'src/common/commom.constant';

const TEST_KEY = 'test-key';
const userId = 1;

jest.mock('jsonwebtoken', () => {
  return {
    sign: jest.fn(() => 'TOKEN'),
    verify: jest.fn(() => ({
      id: userId,
    })),
  };
});

describe('JwtService', () => {
  let service: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtService,
        {
          provide: CONFIG_OPTIONS,
          useValue: { privateKey: TEST_KEY },
        },
      ],
    }).compile();
    service = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Sign', () => {
    it('should return a signed token', () => {
      const token = service.sign(userId);
      expect(typeof token).toBe('string');
      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledWith({ id: userId }, TEST_KEY);
    });
  });
  describe('Verify', () => {
    it('should return the decoded a token', () => {
      const decodedToken = service.verify('TOKEN');
      expect(decodedToken).toEqual({ id: userId });
      expect(jwt.verify).toHaveBeenCalledTimes(1);
      expect(jwt.verify).toHaveBeenCalledWith('TOKEN', TEST_KEY);
    });
  });
});
