import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import type { ContactRepositoryPort } from '../../../../application/contact/port/contact.repository.port';
import { Contact } from '../../../../domain/contact/contact.domain';
import { CustomFieldDefinition } from '../../../../domain/customField/customFieldDefinition.domain';
import { ContactEntity } from '../entity/contact.entity';
import { FieldValueEntity } from '../entity/fieldValue.entity';
import { FieldDefinitionEntity } from '../entity/fieldDefinition.entity';
import { ContactMapper } from '../mapper/contact.mapper';
import { CustomFieldDefinitionMapper } from '../mapper/customFieldDefinition.mapper';

/**
 * Contact TypeORM Repository 구현체
 * Salesforce 스타일 엔티티 사용 (fieldValues, FieldDefinitionEntity)
 */
@Injectable()
export class ContactRepository implements ContactRepositoryPort {
  constructor(
    @InjectRepository(ContactEntity)
    private readonly contactRepo: Repository<ContactEntity>,
    @InjectRepository(FieldValueEntity)
    private readonly valueRepo: Repository<FieldValueEntity>,
    @InjectRepository(FieldDefinitionEntity)
    private readonly definitionRepo: Repository<FieldDefinitionEntity>,
  ) {}

  async findById(id: string): Promise<Contact | null> {
    const entity = await this.contactRepo.findOne({
      where: { id },
      relations: ['fieldValues'],
    });

    if (!entity) {
      return null;
    }

    const fieldDefinitions = await this.loadFieldDefinitions(entity);
    return ContactMapper.toDomain(entity, fieldDefinitions);
  }

  async findByEmail(email: string): Promise<Contact | null> {
    const entity = await this.contactRepo.findOne({
      where: { email },
      relations: ['fieldValues'],
    });

    if (!entity) {
      return null;
    }

    const fieldDefinitions = await this.loadFieldDefinitions(entity);
    return ContactMapper.toDomain(entity, fieldDefinitions);
  }

  async findAll(): Promise<Contact[]> {
    const entities = await this.contactRepo.find({
      relations: ['fieldValues'],
      order: { createdAt: 'DESC' },
    });

    // 모든 필드 정의 한번에 로드
    const allDefinitionIds = new Set<string>();
    for (const entity of entities) {
      for (const value of entity.fieldValues || []) {
        allDefinitionIds.add(value.fieldId);
      }
    }

    const definitions =
      allDefinitionIds.size > 0
        ? await this.definitionRepo.find({
            where: { id: In([...allDefinitionIds]) },
          })
        : [];

    const definitionMap = new Map<string, CustomFieldDefinition>();
    for (const def of definitions) {
      definitionMap.set(def.id, CustomFieldDefinitionMapper.toDomain(def));
    }

    return entities.map((entity) =>
      ContactMapper.toDomain(entity, definitionMap),
    );
  }

  async save(contact: Contact): Promise<void> {
    const entity = ContactMapper.toEntity(contact);

    // 기존 FieldValues 삭제 후 새로 저장 (upsert 대신 단순 처리)
    await this.valueRepo.delete({ recordId: contact.id });

    // Contact와 FieldValues 저장
    await this.contactRepo.save(entity);
  }

  async delete(id: string): Promise<void> {
    // CASCADE로 FieldValues도 함께 삭제됨
    await this.contactRepo.delete({ id });
  }

  /**
   * Contact의 FieldValue에 해당하는 FieldDefinition들 로드
   */
  private async loadFieldDefinitions(
    entity: ContactEntity,
  ): Promise<Map<string, CustomFieldDefinition>> {
    const definitionIds = (entity.fieldValues || []).map((v) => v.fieldId);

    if (definitionIds.length === 0) {
      return new Map();
    }

    const definitions = await this.definitionRepo.find({
      where: { id: In(definitionIds) },
    });

    const map = new Map<string, CustomFieldDefinition>();
    for (const def of definitions) {
      map.set(def.id, CustomFieldDefinitionMapper.toDomain(def));
    }

    return map;
  }
}
