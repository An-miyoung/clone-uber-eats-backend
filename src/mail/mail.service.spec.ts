import got from 'got';
import * as FormData from 'form-data';
import { Test } from '@nestjs/testing';
import { MailService } from './mail.service';
import { CONFIG_OPTIONS } from 'src/common/commom.constant';

const API_KEY = 'test-api-key';
const DOMAIN = 'test-domain';
const FROMEMAIL = 'test-fromEmail';

jest.mock('got');
jest.mock('form-data');

describe('MailService', () => {
  let service: MailService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: CONFIG_OPTIONS,
          useValue: { apiKey: API_KEY, domain: DOMAIN, fromEmail: FROMEMAIL },
        },
      ],
    }).compile();
    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('SendVerificationEMail', () => {
    it('shpuld call sendEmail', () => {
      const sendVerificationEmailArgs = {
        email: 'test@test.com',
        code: 'code',
      };
      jest.spyOn(service, 'sendEmail').mockImplementation(async () => true);
      service.sendVerificationEmail(
        sendVerificationEmailArgs.email,
        sendVerificationEmailArgs.code,
      );
      expect(service.sendEmail).toHaveBeenCalledTimes(1);
      expect(service.sendEmail).toHaveBeenCalledWith(
        'Verify Your Email',
        'verify-email',
        [
          { key: 'code', value: sendVerificationEmailArgs.code },
          { key: 'username', value: sendVerificationEmailArgs.email },
        ],
      );
    });
  });

  describe('sendMail', () => {
    it('should sends email', async () => {
      const result = await service.sendEmail('', '', []);
      const formSpy = jest.spyOn(FormData.prototype, 'append');
      expect(formSpy).toHaveBeenCalled();
      expect(got.post).toHaveBeenCalledTimes(1);
      expect(got.post).toHaveBeenCalledWith(
        `https://api.mailgun.net/v3/${DOMAIN}/messages`,
        expect.any(Object),
      );
      expect(result).toEqual(true);
    });
    it('shoul fail on exception', async () => {
      jest.spyOn(got, 'post').mockImplementation(() => {
        throw new Error();
      });
      const result = await service.sendEmail('', '', []);
      expect(result).toEqual(false);
    });
  });
});
