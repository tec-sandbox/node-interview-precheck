import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer, Purchase } from './entities';
import { CheckController } from './check.controller';
import { CheckService } from './check.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? '127.0.0.1',
      port: Number(process.env.DB_PORT ?? '55432'),
      username: 'precheck',
      password: 'precheck_only_local',
      database: 'precheck',
      entities: [Customer, Purchase],
      synchronize: true, // Temporary environment only: DO NOT use in production.
      retryAttempts: 0,
      logging: false
    }),
    TypeOrmModule.forFeature([Customer, Purchase])
  ],
  controllers: [CheckController],
  providers: [CheckService]
})
export class AppModule {}
