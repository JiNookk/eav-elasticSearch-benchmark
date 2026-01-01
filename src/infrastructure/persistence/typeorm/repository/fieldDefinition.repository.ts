import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomFieldDefinition } from '../../../../domain/customField/customFieldDefinition.domain';
import type { CustomFieldDefinitionRepositoryPort } from '../../../../application/customField/port/customFieldDefinition.repository.port';
import { FieldDefinitionEntity } from '../entity/fieldDefinition.entity';
import { CustomFieldDefinitionMapper } from '../mapper/customFieldDefinition.mapper';

/**
 * FieldDefinition Repository 구현
 * Salesforce 스타일 FieldDefinitionEntity 사용
 */
@Injectable()
export class FieldDefinitionRepository implements CustomFieldDefinitionRepositoryPort {
  constructor(
    @InjectRepository(FieldDefinitionEntity)
    private readonly repository: Repository<FieldDefinitionEntity>,
  ) {}

  async findById(id: string): Promise<CustomFieldDefinition | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) return null;
    return CustomFieldDefinitionMapper.toDomain(entity);
  }

  async findByApiName(apiName: string): Promise<CustomFieldDefinition | null> {
    const entity = await this.repository.findOne({ where: { apiName } });
    if (!entity) return null;
    return CustomFieldDefinitionMapper.toDomain(entity);
  }

  async findAll(): Promise<CustomFieldDefinition[]> {
    const entities = await this.repository.find({
      order: { createdAt: 'ASC' },
    });
    return entities.map((entity) =>
      CustomFieldDefinitionMapper.toDomain(entity),
    );
  }

  async findAllActive(): Promise<CustomFieldDefinition[]> {
    // 새 엔티티에는 isActive 필드가 없으므로 전체 반환
    return this.findAll();
  }

  async save(definition: CustomFieldDefinition): Promise<void> {
    const existingEntity = await this.repository.findOne({
      where: { id: definition.id },
    });

    if (existingEntity) {
      const updatedEntity = CustomFieldDefinitionMapper.updateEntity(
        existingEntity,
        definition,
      );
      await this.repository.save(updatedEntity);
    } else {
      const newEntity = CustomFieldDefinitionMapper.toEntity(definition);
      await this.repository.save(newEntity);
    }
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
