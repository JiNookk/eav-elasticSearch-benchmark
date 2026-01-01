import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CustomFieldValueEntity } from './customFieldValue.entity';

/**
 * Contact TypeORM Entity
 */
@Entity('contacts')
export class ContactEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @OneToMany(() => CustomFieldValueEntity, (value) => value.contact, {
    cascade: true,
  })
  customFieldValues: CustomFieldValueEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
