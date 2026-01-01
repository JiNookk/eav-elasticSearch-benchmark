import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { FieldValueEntity } from './fieldValue.entity';
import { AccountEntity } from './account.entity';

/**
 * Contact (연락처) TypeORM Entity
 * Salesforce Contact 객체와 동일한 구조
 */
@Entity('contacts')
export class ContactEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ name: 'first_name', type: 'varchar', length: 50 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 50 })
  lastName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Index('idx_contacts_account')
  @Column({ name: 'account_id', type: 'varchar', length: 36, nullable: true })
  accountId: string | null;

  @ManyToOne(() => AccountEntity, (account) => account.contacts, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'account_id' })
  account: AccountEntity | null;

  @Index('idx_contacts_status')
  @Column({
    type: 'enum',
    enum: ['active', 'inactive'],
    default: 'active',
  })
  status: 'active' | 'inactive';

  @OneToMany(() => FieldValueEntity, (value) => value.contact, {
    cascade: true,
  })
  fieldValues: FieldValueEntity[];

  @Index('idx_contacts_updated')
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
