import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { CheckService, JoinedRow } from './check.service';

const EXPECTED: JoinedRow[] = [
  { customerId: 1, customerName: 'Ada', orderCount: 2, totalCents: 3000 },
  { customerId: 2, customerName: 'Grace', orderCount: 1, totalCents: 4900 }
];

@Controller()
export class CheckController {
  constructor(private readonly service: CheckService) {}

  @Get('health')
  health() {
    return { status: 'ok', framework: 'NestJS' };
  }

  @Get('join')
  async join() {
    const rows = await this.service.runJoin();
    if (JSON.stringify(rows) !== JSON.stringify(EXPECTED)) {
      throw new InternalServerErrorException('JOIN results do not match the expected values');
    }
    return { status: 'ok', database: 'PostgreSQL', orm: 'TypeORM', join: 'customers x purchases', rows };
  }
}
