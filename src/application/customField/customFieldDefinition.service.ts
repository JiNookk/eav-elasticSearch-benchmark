import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CustomFieldDefinition } from '../../domain/customField/customFieldDefinition.domain';
import type { CustomFieldDefinitionRepositoryPort } from './port/customFieldDefinition.repository.port';
import { CUSTOM_FIELD_DEFINITION_REPOSITORY } from './port/customFieldDefinition.repository.port';
import type { CreateCustomFieldDefinitionDto } from './dto/createCustomFieldDefinition.dto';

/**
 * 커스텀 필드 정의 서비스
 * - 도메인 메서드 조립
 * - 트랜잭션 관리
 * - ID/시간 생성
 */
@Injectable()
export class CustomFieldDefinitionService {
  constructor(
    @Inject(CUSTOM_FIELD_DEFINITION_REPOSITORY)
    private readonly repository: CustomFieldDefinitionRepositoryPort,
  ) {}

  /**
   * 커스텀 필드 정의 생성
   */
  async create(
    dto: CreateCustomFieldDefinitionDto,
  ): Promise<CustomFieldDefinition> {
    // 중복 apiName 체크
    const existing = await this.repository.findByApiName(dto.apiName);
    if (existing) {
      throw new Error(`이미 존재하는 API 이름입니다: ${dto.apiName}`);
    }

    // ID는 서비스에서 생성 (도메인 순수성 유지)
    const id = uuidv4();

    const definition = CustomFieldDefinition.create({
      id,
      name: dto.name,
      apiName: dto.apiName,
      fieldType: dto.fieldType,
      options: dto.options,
      isRequired: dto.isRequired,
    });

    await this.repository.save(definition);
    return definition;
  }

  /**
   * ID로 조회
   */
  async findById(id: string): Promise<CustomFieldDefinition> {
    const definition = await this.repository.findById(id);
    if (!definition) {
      throw new NotFoundException(`커스텀 필드를 찾을 수 없습니다: ${id}`);
    }
    return definition;
  }

  /**
   * 활성화된 필드 전체 조회
   */
  async findAllActive(): Promise<CustomFieldDefinition[]> {
    return this.repository.findAllActive();
  }

  /**
   * 필드 비활성화 (소프트 삭제)
   */
  async deactivate(id: string): Promise<void> {
    const definition = await this.findById(id);
    definition.deactivate();
    await this.repository.save(definition);
  }

  /**
   * 필드 활성화
   */
  async activate(id: string): Promise<void> {
    const definition = await this.findById(id);
    definition.activate();
    await this.repository.save(definition);
  }
}
