import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

/**
 * Field Definition (커스텀 필드 정의) TypeORM Entity
 * Salesforce Custom Field Definition과 동일한 구조
 */
@Entity('custom_field_definitions')
export class FieldDefinitionEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 100 })
  label: string;

  @Column({ name: 'api_name', type: 'varchar', length: 100, unique: true })
  apiName: string;

  @Column({
    name: 'data_type',
    type: 'enum',
    enum: ['text', 'number', 'date', 'select', 'multi_select'],
  })
  dataType: 'text' | 'number' | 'date' | 'select' | 'multi_select';

  @Column({ type: 'json', nullable: true })
  options: string[] | null;

  @Column({ name: 'is_required', type: 'boolean', default: false })
  isRequired: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
