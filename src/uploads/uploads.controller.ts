import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import * as AWS from 'aws-sdk';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly configService: ConfigService) {}
  @Post('')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file) {
    AWS.config.update({
      credentials: {
        accessKeyId: this.configService.get('AWS_KEY'),
        secretAccessKey: this.configService.get('AWS_SECRET'),
      },
    });
    try {
      // Bucket 을 만들때 최초 1번만 실행,But 대쉬보드에서 생성하는 거 추천
      // const upload = await new AWS.S3()
      //   .createBucket({
      //     Bucket: BUCKET_NAME,
      //   })
      //   .promise();

      const BUCKET_NAME = this.configService.get('AWS_BUCKET_NAME');
      const objectName = `${Date.now() + file.originalname}`;
      await new AWS.S3()
        .putObject({
          Body: file.buffer,
          Bucket: BUCKET_NAME,
          Key: objectName,
          ACL: 'public-read',
        })
        .promise();
      const url = `https://${BUCKET_NAME}.s3.ap-northeast-2.amazonaws.com/${objectName}`;
      return { url };
    } catch (error) {
      console.log(error);
    }
  }
}
