import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { VerifyEmailOutput } from './dtos/verify-email.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Verification)
    private readonly verification: Repository<Verification>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      // 이미 존재하는 email 이 있는지 확인
      const exists = await this.users.findOne({ email });
      if (exists) {
        return { ok: false, error: '이미 등록된 이메일입니다.' };
      }
      // 새로운 user 만들기
      const user = await this.users.save(
        this.users.create({ email, password, role }),
      );
      // email verification 만들기
      const mailVerification = await this.verification.save(
        this.verification.create({ user }),
      );
      this.mailService.sendVerificationEmail(user.email, mailVerification.code);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: '계정을 만들지 못했습니다.' };
    }
  }

  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    try {
      // find user
      const user = await this.users.findOne(
        { email },
        { select: ['id', 'password'] },
      );
      if (!user) {
        return {
          ok: false,
          error: '가입하지 않은 이메일입니다.',
        };
      }
      // 이메일과 비번 확인
      const passwordCorrect = await user.checkPassword(password);

      if (!passwordCorrect) {
        return {
          ok: false,
          error: '비밀번호가 다릅니다.',
        };
      }
      const token = this.jwtService.sign(user.id);
      return {
        ok: true,
        token,
      };
    } catch (error) {
      return {
        ok: false,
        error: '로그인에 실패했습니다.',
      };
    }
  }

  async findUserById(id: number): Promise<UserProfileOutput> {
    try {
      const user = await this.users.findOneOrFail({ id });
      return {
        ok: true,
        user,
      };
    } catch (error) {
      return {
        ok: false,
        error: '사용자를 찾을 수 없습니다.',
      };
    }
  }

  async editProfile(
    userId: number,
    { email, password }: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      const user = await this.users.findOne(userId);
      if (email) {
        user.email = email;
        user.verified = false;
        this.verification.delete({ user: { id: user.id } });
        const mailVerification = await this.verification.save(
          this.verification.create({ user }),
        );
        this.mailService.sendVerificationEmail(
          user.email,
          mailVerification.code,
        );
      }
      if (password) {
        user.password = password;
      }
      await this.users.save(user);
      return {
        ok: true,
        user,
      };
    } catch (error) {
      return {
        ok: false,
        error: '사용자 프로파일 수정에 실패했습니다.',
      };
    }
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.verification.findOne(
        { code },
        { relations: ['user'] },
      );
      if (verification) {
        const { user } = verification;
        user.verified = true;
        await this.users.save(user);
        await this.verification.delete(verification.id);
        return {
          ok: true,
        };
      }
      return {
        ok: false,
        error: '이메일 인증이 존재하지 않습니다.',
      };
    } catch (error) {
      return {
        ok: false,
        error: '이메일로 올바른 사용자인지 식별하는데 실패했습니다.',
      };
    }
  }
}
