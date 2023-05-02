import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { Repository, getConnection } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Verification } from 'src/users/entities/verification.entity';
import { query } from 'express';

jest.mock('got', () => {
  return {
    post: jest.fn(),
  };
});

const GRAPHQL_ENDPOINT = '/graphql';
const testUser = {
  email: 'noonchicat@naver.com',
  password: '1234567',
};

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let verificationRepository: Repository<Verification>;
  let jwtToken: string;

  const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
  const publicTest = (query: string) => baseTest().send({ query });
  const privateTest = (query: string) =>
    baseTest().set('X-JWT', jwtToken).send({ query });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    verificationRepository = module.get<Repository<Verification>>(
      getRepositoryToken(Verification),
    );
    await app.init();
  });

  afterAll(async () => {
    await getConnection().dropDatabase();
    app.close();
  });

  describe('createAccount', () => {
    it('should create account', () => {
      return (
        publicTest(`
          mutation{
            createAccount(input:{
              email: "${testUser.email}",
              password: "${testUser.password}",
              role:owner
            }){
              ok
              error
            }
          }
      `)
          // return request(app.getHttpServer())
          //   .post(GRAPHQL_ENDPOINT)
          //   .send({
          //     query: `
          //     mutation{
          //       createAccount(input:{
          //         email: "${testUser.email}",
          //         password: "${testUser.password}",
          //         role:owner
          //       }){
          //         ok
          //         error
          //       }
          //     }
          //     `,
          //   })
          .expect(200)
          .expect((res) => {
            expect(res.body.data.createAccount.ok).toBe(true);
          })
      );
    });
    it('should fail if account already exists', () => {
      return publicTest(`
        mutation{
          createAccount(input:{
            email: "${testUser.email}",
            password: "${testUser.password}",
            role:owner
          }){
            ok
            error
          }
        }
        `)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createAccount.ok).toBe(false);
          expect(res.body.data.createAccount.error).toEqual(
            '이미 등록된 이메일입니다.',
          );
        });
    });
  });

  describe('login', () => {
    it('should login with correct credential', () => {
      return publicTest(`
        mutation{
          login(input:{
            email: "${testUser.email}",
            password: "${testUser.password}",
          }){
            ok
            error
            token
          }
        }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBe(true);
          expect(login.error).toBe(null);
          expect(login.token).toEqual(expect.any(String));
          jwtToken = login.token;
        });
    });
    it('should not be able to login with wrong credential', () => {
      return publicTest(`
        mutation{
          login(input:{
            email: "${testUser.email}",
            password: "121212",
          }){
            ok
            error
            token
          }
        }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBe(false);
          expect(login.error).toBe('비밀번호가 다릅니다.');
          expect(login.token).toBe(null);
        });
    });
  });

  describe('userProfole', () => {
    let userId: number;
    beforeAll(async () => {
      const [user] = await usersRepository.find();
      userId = user.id;
    });
    it('should see a user profile', () => {
      return privateTest(`
        {
          userProfile(userId:${userId}){
            ok
            error
            user{id}
          }
        }
      `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                userProfile: { ok, error, user },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(user.id).toEqual(userId);
        });
    });
    it('should not find a user profile', () => {
      return privateTest(`
        {
          userProfile(userId:999){
            ok
            error
            user{id}
          }
        }
     `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                userProfile: { ok, error, user },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(error).toBe('사용자를 찾을 수 없습니다.');
          expect(user).toBe(null);
        });
    });
  });

  describe('me', () => {
    it('should find my profile', () => {
      return privateTest(`
        {
          me {
            email
          }
        }
      `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                me: { email },
              },
            },
          } = res;
          expect(email).toBe(testUser.email);
        });
    });
    it('should not allow logged out user', () => {
      return publicTest(`
        {
          me {
            email
          }
        }
     `)
        .expect(200)
        .expect((res) => {
          const {
            body: { errors },
          } = res;
          const [error] = errors;
          expect(error.message).toBe('Forbidden resource');
        });
    });
  });

  describe('editProfile', () => {
    const NEW_EMAIL = 'newUser@test.com';
    it('should change email', () => {
      return privateTest(`
        mutation
          {editProfile(input:{
            email: "${NEW_EMAIL}"
          }){
            ok
            error
            user{
              id
            }
          }
        }
      `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                editProfile: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });
    it('shoul have new email', () => {
      return privateTest(`
        {
          me {
            email
          }
        }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                me: { email },
              },
            },
          } = res;
          expect(email).toBe(NEW_EMAIL);
        });
    });
    it('should change password', () => {
      return privateTest(`
        mutation
          {editProfile(input:{
            password: "121212"
          }){
            ok
            error
            user{
              id
            }
          }
        }
      `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                editProfile: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });
  });
  describe('verifyEmail', () => {
    let verificationCode: string;
    beforeAll(async () => {
      const [verification] = await verificationRepository.find();
      verificationCode = verification.code;
    });
    it('should verify email', () => {
      return publicTest(`
        mutation{
          verifyEmail(input:{
            code: "${verificationCode}"
          }){
            error
            ok
          }
        }
      `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                verifyEmail: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });
    it('should fail on wrong verification code', () => {
      return publicTest(`
        mutation{
          verifyEmail(input:{
            code: "xxxxx"
          }){
            error
            ok
          }
        }
      `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                verifyEmail: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(error).toBe('이메일 인증이 존재하지 않습니다.');
        });
    });
  });
});
