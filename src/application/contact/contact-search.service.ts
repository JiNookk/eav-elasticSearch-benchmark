import { Inject, Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ElasticsearchService } from '../../infrastructure/elasticsearch/elasticsearch.service';
import type {
  SearchContactsDto,
  SearchContactsResponse,
  ContactResponse,
} from './dto/searchContacts.dto';
import { ContactEntity } from '../../infrastructure/persistence/typeorm/entity/contact.entity';
import { CustomFieldValueEntity } from '../../infrastructure/persistence/typeorm/entity/customFieldValue.entity';
import { CustomFieldDefinitionEntity } from '../../infrastructure/persistence/typeorm/entity/customFieldDefinition.entity';

/**
 * Contact 검색 서비스
 * - MySQL (EAV) vs Elasticsearch 성능 비교용
 * - 쿼리 시간 측정
 */
@Injectable()
export class ContactSearchService {
  private readonly logger = new Logger(ContactSearchService.name);

  constructor(
    private readonly dataSource: DataSource,
    @Inject(ElasticsearchService)
    private readonly esService: ElasticsearchService,
  ) {}

  /**
   * Contact 검색 (MySQL 또는 ES)
   */
  async search(dto: SearchContactsDto): Promise<SearchContactsResponse> {
    const startTime = Date.now();

    let result: SearchContactsResponse;

    if (dto.dataSource === 'es') {
      result = await this.searchWithEs(dto);
    } else {
      result = await this.searchWithMySql(dto);
    }

    const queryTime = Date.now() - startTime;

    return {
      ...result,
      queryTime,
    };
  }

  /**
   * Elasticsearch 검색
   */
  private async searchWithEs(
    dto: SearchContactsDto,
  ): Promise<SearchContactsResponse> {
    const sort: Record<string, 'asc' | 'desc'> = {};
    if (dto.sort && dto.sort.length > 0) {
      for (const s of dto.sort) {
        sort[s.field] = s.direction;
      }
    }

    const filters: Record<string, string | number> = {};
    if (dto.filter && dto.filter.length > 0) {
      for (const f of dto.filter) {
        if (f.operator === 'eq') {
          filters[f.field] = f.value as string | number;
        }
      }
    }

    const result = await this.esService.searchContacts({
      keyword: dto.search,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      sort: Object.keys(sort).length > 0 ? sort : undefined,
      page: dto.page,
      size: dto.pageSize,
    });

    return {
      data: result.items.map((item) => ({
        id: item.id,
        email: item.email,
        name: item.name,
        customFields: item.customFields,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      total: result.total,
      page: dto.page,
      pageSize: dto.pageSize,
      queryTime: 0, // 나중에 채워짐
      dataSource: 'es',
    };
  }

  /**
   * MySQL 검색 (EAV 패턴 - 느림)
   */
  private async searchWithMySql(
    dto: SearchContactsDto,
  ): Promise<SearchContactsResponse> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // 기본 쿼리 빌더
      let qb = queryRunner.manager
        .createQueryBuilder(ContactEntity, 'c')
        .leftJoinAndSelect('c.customFieldValues', 'cfv');

      // 검색 조건
      if (dto.search) {
        qb = qb.andWhere('(c.name LIKE :search OR c.email LIKE :search)', {
          search: `%${dto.search}%`,
        });
      }

      // 커스텀 필드 필터 (EAV 패턴으로 서브쿼리 필요 - 느림)
      if (dto.filter && dto.filter.length > 0) {
        for (let i = 0; i < dto.filter.length; i++) {
          const filter = dto.filter[i];
          if (filter.field.endsWith('__c')) {
            // 커스텀 필드 필터: 서브쿼리로 처리
            const subQuery = queryRunner.manager
              .createQueryBuilder(CustomFieldValueEntity, `cfv${i}`)
              .innerJoin(
                CustomFieldDefinitionEntity,
                `cfd${i}`,
                `cfd${i}.id = cfv${i}.fieldDefinitionId`,
              )
              .where(`cfv${i}.contactId = c.id`)
              .andWhere(`cfd${i}.apiName = :apiName${i}`, {
                [`apiName${i}`]: filter.field,
              });

            if (filter.operator === 'eq') {
              subQuery.andWhere(
                `(cfv${i}.valueText = :value${i} OR cfv${i}.valueSelect = :value${i})`,
                { [`value${i}`]: filter.value },
              );
            }

            qb = qb.andWhere(`EXISTS (${subQuery.getQuery()})`);
            qb.setParameters(subQuery.getParameters());
          }
        }
      }

      // 전체 개수 조회
      const total = await qb.getCount();

      // 정렬 (기본 필드만 가능, 커스텀 필드 정렬은 매우 복잡)
      if (dto.sort && dto.sort.length > 0) {
        for (const s of dto.sort) {
          if (!s.field.endsWith('__c')) {
            qb = qb.addOrderBy(
              `c.${s.field}`,
              s.direction.toUpperCase() as 'ASC' | 'DESC',
            );
          }
        }
      } else {
        qb = qb.addOrderBy('c.createdAt', 'DESC');
      }

      // 페이지네이션
      const offset = (dto.page - 1) * dto.pageSize;
      qb = qb.skip(offset).take(dto.pageSize);

      const contacts = await qb.getMany();

      // 커스텀 필드 정의 로드
      const definitionIds = new Set<string>();
      for (const contact of contacts) {
        for (const cfv of contact.customFieldValues || []) {
          definitionIds.add(cfv.fieldDefinitionId);
        }
      }

      const definitions =
        definitionIds.size > 0
          ? await queryRunner.manager.find(CustomFieldDefinitionEntity, {
              where: Array.from(definitionIds).map((id) => ({ id })),
            })
          : [];

      const defMap = new Map(definitions.map((d) => [d.id, d]));

      // Response 변환
      const data: ContactResponse[] = contacts.map((contact) => {
        const customFields: Record<string, string | number | Date | null> = {};

        for (const cfv of contact.customFieldValues || []) {
          const def = defMap.get(cfv.fieldDefinitionId);
          if (def) {
            customFields[def.apiName] =
              cfv.valueText ??
              cfv.valueNumber ??
              cfv.valueDate ??
              cfv.valueSelect ??
              null;
          }
        }

        return {
          id: contact.id,
          email: contact.email,
          name: contact.name,
          customFields,
          createdAt: contact.createdAt,
          updatedAt: contact.updatedAt,
        };
      });

      return {
        data,
        total,
        page: dto.page,
        pageSize: dto.pageSize,
        queryTime: 0,
        dataSource: 'mysql',
      };
    } finally {
      await queryRunner.release();
    }
  }
}
