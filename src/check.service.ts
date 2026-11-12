import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Customer, Purchase } from './entities';

export type JoinedRow = {
  customerId: number;
  customerName: string;
  orderCount: number;
  totalCents: number;
};

@Injectable()
export class CheckService {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  async runJoin(): Promise<JoinedRow[]> {
    // Fixed primary keys: the operation can be repeated without creating duplicate rows.
    await this.db.getRepository(Customer).save([
      { id: 1, name: 'Ada' },
      { id: 2, name: 'Grace' }
    ]);
    await this.db.getRepository(Purchase).save([
      { id: 10, amountCents: 1200, customer: { id: 1 } },
      { id: 11, amountCents: 1800, customer: { id: 1 } },
      { id: 12, amountCents: 4900, customer: { id: 2 } }
    ]);

    // Real JOIN between customers and purchases using the TypeORM QueryBuilder.
    const raw = await this.db
      .getRepository(Customer)
      .createQueryBuilder('customer')
      .innerJoin('customer.purchases', 'purchase')
      .select('customer.id', 'customerId')
      .addSelect('customer.name', 'customerName')
      .addSelect('COUNT(purchase.id)', 'orderCount')
      .addSelect('SUM(purchase.amountCents)', 'totalCents')
      .groupBy('customer.id')
      .addGroupBy('customer.name')
      .orderBy('customer.id', 'ASC')
      .getRawMany<{
        customerId: string | number;
        customerName: string;
        orderCount: string;
        totalCents: string;
      }>();

    return raw.map((row) => ({
      customerId: Number(row.customerId),
      customerName: row.customerName,
      orderCount: Number(row.orderCount),
      totalCents: Number(row.totalCents)
    }));
  }
}
