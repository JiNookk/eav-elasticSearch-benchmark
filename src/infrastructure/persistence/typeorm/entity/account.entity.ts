import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ContactEntity } from './contact.entity';

/**
 * Account (회사) TypeORM Entity
 * Salesforce Account 객체와 동일한 구조
 */
@Entity('accounts')
export class AccountEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Index('idx_accounts_industry')
  @Column({ type: 'varchar', length: 100, nullable: true })
  industry: string | null;

  @Column({
    name: 'annual_revenue',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  annualRevenue: number | null;

  @OneToMany(() => ContactEntity, (contact) => contact.account)
  contacts: ContactEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
