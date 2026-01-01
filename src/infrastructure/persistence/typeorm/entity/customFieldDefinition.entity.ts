import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 커스텀 필드 정의 TypeORM Entity
 */
@Entity('custom_field_definitions')
export class CustomFieldDefinitionEntity {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'api_name', type: 'varchar', length: 100, unique: true })
  apiName: string;

  @Column({
    name: 'field_type',
    type: 'enum',
    enum: ['TEXT', 'NUMBER', 'DATE', 'SELECT'],
  })
  fieldType: 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT';

  @Column({ type: 'json', nullable: true })
  options: string[] | null;

  @Column({ name: 'is_required', type: 'boolean', default: false })
  isRequired: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
