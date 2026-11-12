import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @OneToMany(() => Purchase, (purchase) => purchase.customer)
  purchases!: Purchase[];
}

@Entity('purchases')
export class Purchase {
  @PrimaryColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'integer' })
  amountCents!: number;

  @ManyToOne(() => Customer, (customer) => customer.purchases, { nullable: false })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;
}
