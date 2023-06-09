/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from '../common/commom.constant';
import { MailModuleOptions, EmailVar } from './mail.interface';
import got from 'got';
import * as FormData from 'form-data';

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
  ) {
    // this.sendEmail('testing', 'verify-email', [
    //   { key: 'code', value: 'lalala' },
    //   { key: 'username', value: 'Cathy' },
    // ]);
    // this.sendEmail('testing', 'verify-email', [
    //   { key: 'code', value: 'lalala' },
    //   { key: 'username', value: 'Cathy' },
    // ])
    //   .then(() => {
    //     console.log('Message sent');
    //   })
    //   .catch((error) => {
    //     console.log(error.response.body);
    //   });
  }
  async sendEmail(
    subject: string,
    template: string,
    emailVar: EmailVar[],
  ): Promise<boolean> {
    const form = new FormData();
    form.append('from', `Mi0 from Nuber Eats<mailgun@${this.options.domain}>`);
    form.append('to', 'noonchicat@naver.com');
    form.append('subject', subject);
    form.append('template', template);
    emailVar.forEach((eVar) => form.append(`v:${eVar.key}`, eVar.value));
    try {
      await got.post(
        `https://api.mailgun.net/v3/${this.options.domain}/messages`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(
              `api:${this.options.apiKey}`,
            ).toString('base64')}`,
          },
          body: form,
        },
      );
      return true;
    } catch (error) {
      // console.log(error);
      return false;
    }
  }

  sendVerificationEmail(email: string, code: string) {
    this.sendEmail('Verify Your Email', 'verify-email', [
      { key: 'code', value: code },
      { key: 'username', value: email },
    ])
      .then((_) => {})
      .catch((_) => {});
  }
}
