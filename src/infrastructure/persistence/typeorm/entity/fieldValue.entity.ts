import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ContactEntity } from './contact.entity';
import { FieldDefinitionEntity } from './fieldDefinition.entity';

/**
 * Field Value (커스텀 필드 값) TypeORM Entity
 * EAV 패턴으로 커스텀 필드 값 저장
 * Salesforce Custom Field Value와 동일한 구조
 */
@Entity('custom_field_values')
@Index('idx_field_values_record', ['recordId'])
@Index('idx_field_values_field', ['fieldId'])
@Index('idx_field_values_record_field', ['recordId', 'fieldId'], {
  unique: true,
})
export class FieldValueEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ name: 'record_id', type: 'varchar', length: 36 })
  recordId: string;

  @Column({ name: 'field_id', type: 'varchar', length: 36 })
  fieldId: string;

  @Column({ type: 'text', nullable: true })
  value: string | null;

  @ManyToOne(() => ContactEntity, (contact) => contact.fieldValues, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'record_id' })
  contact: ContactEntity;

  @ManyToOne(() => FieldDefinitionEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'field_id' })
  fieldDefinition: FieldDefinitionEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
