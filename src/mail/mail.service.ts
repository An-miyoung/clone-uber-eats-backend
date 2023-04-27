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
  private async sendEmail(
    subject: string,
    template: string,
    emailVar: EmailVar[],
  ) {
    const form = new FormData();
    form.append('from', `Mi0 from Nuber Eats<mailgun@${this.options.domain}>`);
    form.append('to', 'noonchicat@naver.com');
    form.append('subject', subject);
    form.append('template', template);
    emailVar.forEach((eVar) => form.append(`v:${eVar.key}`, eVar.value));
    try {
      await got(`https://api.mailgun.net/v3/${this.options.domain}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(
            `api:${this.options.apiKey}`,
          ).toString('base64')}`,
        },
        body: form,
      });
    } catch (error) {
      console.log(error);
    }
  }

  sendVerificationEmail(email: string, code: string) {
    this.sendEmail('Verify Your Email', 'verify-email', [
      { key: 'code', value: code },
      { key: 'username', value: email },
    ])
      .then(() => {
        console.log('Message sent');
      })
      .catch((error) => {
        console.log(error.response.body);
      });
  }
}
