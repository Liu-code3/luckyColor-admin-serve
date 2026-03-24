import {
  Controller,
  Get,
  INestApplication,
  Module
} from '@nestjs/common';
import { Test } from '@nestjs/testing';

@Controller('e2e')
class MinimalE2eController {
  @Get('health')
  health() {
    return {
      status: 'ok'
    };
  }
}

@Module({
  controllers: [MinimalE2eController]
})
class MinimalE2eModule {}

describe('e2e sample', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [MinimalE2eModule]
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    await app.listen(0, '127.0.0.1');

    const address = app.getHttpServer().address();
    if (!address || typeof address === 'string') {
      throw new Error('Failed to resolve e2e server address.');
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns a healthy response from a minimal nest app', async () => {
    const response = await fetch(`${baseUrl}/e2e/health`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: 'ok'
    });
  });
});
