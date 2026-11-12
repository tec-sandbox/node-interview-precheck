import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  const port = Number(process.env.PORT ?? '0');
  await app.listen(port, '127.0.0.1');
  const address = app.getHttpServer().address();
  if (!address || typeof address === 'string') {
    throw new Error('Could not determine the HTTP port');
  }
  console.log(`PRECHECK_READY http://127.0.0.1:${address.port}`);

  const close = async () => {
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', close);
  process.on('SIGTERM', close);
}

bootstrap().catch((error: unknown) => {
  console.error('PRECHECK_START_ERROR', error);
  process.exitCode = 1;
});
