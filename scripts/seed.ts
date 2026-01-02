/**
 * 100만 건 시딩 스크립트
 * EAV 패턴 vs ES 성능 비교용 데이터 생성
 *
 * 테이블 구조 (현재 DB):
 *   - contacts: 고객 (id, email, first_name, last_name, phone, status)
 *   - custom_field_definitions: 커스텀 필드 정의
 *   - custom_field_values: 커스텀 필드 값 (EAV, 타입별 컬럼)
 *
 * 사용법:
 *   npx ts-node scripts/seed.ts [options]
 *
 * 옵션:
 *   --contacts=N     Contact 수 (기본: 500000)
 *   --batch=N        배치 크기 (기본: 5000)
 *   --skip-es        ES 동기화 스킵
 *   --es-only        ES 동기화만 실행 (MySQL 시딩 스킵)
 *   --resume         ES 동기화 이어서 실행 (인덱스 삭제 안함)
 */

import { faker } from '@faker-js/faker/locale/ko';
import { DataSource } from 'typeorm';
import { Client } from '@elastic/elasticsearch';
import { v4 as uuidv4 } from 'uuid';

// 타입 정의
interface FieldDefRow {
  id: string;
  api_name: string;
  data_type: string;
}

interface CountRow {
  cnt: string;
}

interface ContactRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  custom_fields_raw: string | null;
}

// 설정
const CONFIG = {
  CONTACTS_COUNT: parseInt(
    process.argv.find((a) => a.startsWith('--contacts='))?.split('=')[1] ||
      '500000',
    10,
  ),
  BATCH_SIZE: parseInt(
    process.argv.find((a) => a.startsWith('--batch='))?.split('=')[1] || '5000',
    10,
  ),
  SKIP_ES: process.argv.includes('--skip-es'),
  ES_ONLY: process.argv.includes('--es-only'),
  RESUME: process.argv.includes('--resume'),
};

// 커스텀 필드 정의 (엔티티 구조에 맞춤)
// data_type: text, number, date, select, multi_select
const FIELD_DEFINITIONS: Array<{
  label: string;
  apiName: string;
  dataType: 'text' | 'number' | 'date' | 'select' | 'multi_select';
  options: string[] | null;
}> = [
  {
    label: 'Department',
    apiName: 'department__c',
    dataType: 'select',
    options: [
      'Sales',
      'Marketing',
      'Engineering',
      'HR',
      'Finance',
      'Operations',
    ],
  },
  {
    label: 'Job Title',
    apiName: 'job_title__c',
    dataType: 'select',
    options: ['Intern', 'Associate', 'Manager', 'Director', 'VP', 'C-Level'],
  },
  {
    label: 'Annual Revenue',
    apiName: 'annual_revenue__c',
    dataType: 'number',
    options: null,
  },
  {
    label: 'Contract Start',
    apiName: 'contract_start__c',
    dataType: 'date',
    options: null,
  },
  {
    label: 'Lead Source',
    apiName: 'lead_source__c',
    dataType: 'select',
    options: ['Web', 'Referral', 'Event', 'Cold Call', 'Partner'],
  },
  {
    label: 'Last Contact Date',
    apiName: 'last_contact_date__c',
    dataType: 'date',
    options: null,
  },
  {
    label: 'Score',
    apiName: 'score__c',
    dataType: 'number',
    options: null,
  },
  {
    label: 'Notes',
    apiName: 'notes__c',
    dataType: 'text',
    options: null,
  },
  {
    label: 'Region',
    apiName: 'region__c',
    dataType: 'select',
    options: ['APAC', 'EMEA', 'Americas'],
  },
  {
    label: 'Tier',
    apiName: 'tier__c',
    dataType: 'select',
    options: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
  },
];

// 데이터 소스 생성
function createDataSource(): DataSource {
  return new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3307', 10),
    username: process.env.DB_USER || 'app',
    password: process.env.DB_PASSWORD || 'app123',
    database: process.env.DB_NAME || 'custom_fields',
    logging: false,
    extra: {
      connectionLimit: 10,
    },
  });
}

// ES 클라이언트 생성
function createEsClient(): Client {
  return new Client({
    node: process.env.ES_NODE || 'http://localhost:9200',
  });
}

// 진행률 표시
function showProgress(current: number, total: number, label: string): void {
  const percent = Math.round((current / total) * 100);
  const bar =
    '█'.repeat(Math.floor(percent / 2)) +
    '░'.repeat(50 - Math.floor(percent / 2));
  process.stdout.write(
    `\r${label}: [${bar}] ${percent}% (${current.toLocaleString()}/${total.toLocaleString()})`,
  );
}

// 커스텀 필드 정의 시딩
async function seedFieldDefinitions(
  dataSource: DataSource,
): Promise<Map<string, { id: string; fieldType: string }>> {
  console.log('\n📦 필드 정의 시딩...');

  const fieldIdMap = new Map<string, { id: string; fieldType: string }>();

  for (let i = 0; i < FIELD_DEFINITIONS.length; i++) {
    const def = FIELD_DEFINITIONS[i];
    const id = uuidv4();

    await dataSource.query(
      `INSERT INTO custom_field_definitions (id, label, api_name, data_type, options, is_required)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE label = VALUES(label), data_type = VALUES(data_type), options = VALUES(options)`,
      [
        id,
        def.label,
        def.apiName,
        def.dataType,
        def.options ? JSON.stringify(def.options) : null,
        false,
      ],
    );
  }

  // 기존 필드 ID 조회 (이미 존재하는 경우)
  const existing: FieldDefRow[] = await dataSource.query(
    'SELECT id, api_name, data_type FROM custom_field_definitions',
  );
  for (const row of existing) {
    fieldIdMap.set(row.api_name, { id: row.id, fieldType: row.data_type });
  }

  console.log(`  ✅ ${FIELD_DEFINITIONS.length}개 필드 정의 완료`);
  return fieldIdMap;
}

// 랜덤 커스텀 필드 값 생성 (단일 value 컬럼용)
function generateFieldValue(def: (typeof FIELD_DEFINITIONS)[0]): string | null {
  switch (def.dataType) {
    case 'select':
    case 'multi_select':
      return faker.helpers.arrayElement(def.options!);
    case 'number':
      if (def.apiName === 'score__c') {
        return String(faker.number.int({ min: 0, max: 100 }));
      }
      return String(faker.number.int({ min: 10000, max: 100000000 }));
    case 'date':
      return faker.date.past({ years: 3 }).toISOString().split('T')[0];
    case 'text':
      return faker.lorem.sentence();
    default:
      return null;
  }
}

// Contact + Custom Field Values 배치 시딩
async function seedContacts(
  dataSource: DataSource,
  fieldIdMap: Map<string, { id: string; fieldType: string }>,
): Promise<void> {
  console.log(
    `\n👥 Contact 시딩 시작 (${CONFIG.CONTACTS_COUNT.toLocaleString()}건)...`,
  );

  const startTime = Date.now();

  for (
    let offset = 0;
    offset < CONFIG.CONTACTS_COUNT;
    offset += CONFIG.BATCH_SIZE
  ) {
    const batchSize = Math.min(
      CONFIG.BATCH_SIZE,
      CONFIG.CONTACTS_COUNT - offset,
    );

    // Contact 데이터 생성
    const contacts: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      status: 'active' | 'inactive';
    }> = [];

    const fieldValues: Array<{
      id: string;
      recordId: string;
      fieldId: string;
      value: string | null;
    }> = [];

    for (let i = 0; i < batchSize; i++) {
      const contactId = uuidv4();
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();

      contacts.push({
        id: contactId,
        firstName,
        lastName,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        status: faker.helpers.arrayElement(['active', 'inactive']),
      });

      // 각 Contact에 대해 모든 커스텀 필드 값 생성
      for (const def of FIELD_DEFINITIONS) {
        const fieldInfo = fieldIdMap.get(def.apiName);
        if (!fieldInfo) continue;

        const value = generateFieldValue(def);

        fieldValues.push({
          id: uuidv4(),
          recordId: contactId,
          fieldId: fieldInfo.id,
          value,
        });
      }
    }

    // Contact 배치 삽입
    if (contacts.length > 0) {
      const placeholders = contacts
        .map(() => '(?, ?, ?, ?, ?, NOW(), NOW())')
        .join(', ');
      const values = contacts.flatMap((c) => [
        c.id,
        c.email,
        c.firstName,
        c.lastName,
        c.status,
      ]);
      await dataSource.query(
        `INSERT INTO contacts (id, email, first_name, last_name, status, created_at, updated_at) VALUES ${placeholders}`,
        values,
      );
    }

    // Field Values 배치 삽입 (청크 분할)
    const FIELD_VALUES_CHUNK = 5000;
    for (
      let fvOffset = 0;
      fvOffset < fieldValues.length;
      fvOffset += FIELD_VALUES_CHUNK
    ) {
      const chunk = fieldValues.slice(fvOffset, fvOffset + FIELD_VALUES_CHUNK);
      const fvPlaceholders = chunk.map(() => '(?, ?, ?, ?)').join(', ');
      const fvValues = chunk.flatMap((fv) => [
        fv.id,
        fv.recordId,
        fv.fieldId,
        fv.value,
      ]);
      await dataSource.query(
        `INSERT INTO custom_field_values (id, record_id, field_id, value) VALUES ${fvPlaceholders}`,
        fvValues,
      );
    }

    showProgress(offset + batchSize, CONFIG.CONTACTS_COUNT, '  MySQL');
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n  ✅ MySQL 시딩 완료 (${elapsed}초)`);
}

// ES 인덱스 생성
async function createEsIndex(esClient: Client, resume: boolean): Promise<void> {
  console.log('\n🔍 ES 인덱스 생성...');

  const indexExists = await esClient.indices.exists({ index: 'contacts' });
  if (indexExists) {
    if (resume) {
      console.log('  ⏩ Resume 모드: 기존 인덱스 유지');
      return;
    }
    console.log('  ⚠️  기존 인덱스 삭제 중...');
    await esClient.indices.delete({ index: 'contacts' });
  }

  await esClient.indices.create({
    index: 'contacts',
    settings: {
      number_of_shards: 1,
      number_of_replicas: 0,
      refresh_interval: '-1', // 벌크 인덱싱 중 리프레시 비활성화
      'index.max_ngram_diff': 8,
      analysis: {
        tokenizer: {
          ngram_tokenizer: {
            type: 'ngram' as const,
            min_gram: 2,
            max_gram: 10,
            token_chars: ['letter', 'digit'] as const,
          },
        },
        analyzer: {
          ngram_analyzer: {
            type: 'custom' as const,
            tokenizer: 'ngram_tokenizer',
            filter: ['lowercase'],
          },
        },
      },
    },
    mappings: {
      properties: {
        id: { type: 'keyword' },
        name: {
          type: 'keyword',
          fields: {
            search: {
              type: 'text',
              analyzer: 'ngram_analyzer',
              search_analyzer: 'standard',
            },
          },
        },
        email: {
          type: 'keyword',
          fields: {
            search: {
              type: 'text',
              analyzer: 'ngram_analyzer',
              search_analyzer: 'standard',
            },
          },
        },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
        customFields: {
          type: 'object',
          dynamic: 'true',
          properties: {
            department__c: {
              type: 'keyword',
              fields: {
                search: {
                  type: 'text',
                  analyzer: 'ngram_analyzer',
                  search_analyzer: 'standard',
                },
              },
            },
            job_title__c: {
              type: 'keyword',
              fields: {
                search: {
                  type: 'text',
                  analyzer: 'ngram_analyzer',
                  search_analyzer: 'standard',
                },
              },
            },
            annual_revenue__c: { type: 'long' },
            contract_start__c: { type: 'date' },
            lead_source__c: {
              type: 'keyword',
              fields: {
                search: {
                  type: 'text',
                  analyzer: 'ngram_analyzer',
                  search_analyzer: 'standard',
                },
              },
            },
            last_contact_date__c: { type: 'date' },
            score__c: { type: 'integer' },
            notes__c: {
              type: 'keyword',
              fields: {
                search: {
                  type: 'text',
                  analyzer: 'ngram_analyzer',
                  search_analyzer: 'standard',
                },
              },
            },
            region__c: {
              type: 'keyword',
              fields: {
                search: {
                  type: 'text',
                  analyzer: 'ngram_analyzer',
                  search_analyzer: 'standard',
                },
              },
            },
            tier__c: {
              type: 'keyword',
              fields: {
                search: {
                  type: 'text',
                  analyzer: 'ngram_analyzer',
                  search_analyzer: 'standard',
                },
              },
            },
          },
        },
      },
    },
  });

  console.log('  ✅ ES 인덱스 생성 완료');
}

// ES 동기화
async function syncToEs(
  dataSource: DataSource,
  esClient: Client,
  resume: boolean,
): Promise<void> {
  console.log(`\n🔄 ES 동기화 시작...`);

  // 전체 Contact 수 조회
  const countResult: CountRow[] = await dataSource.query(
    'SELECT COUNT(*) as cnt FROM contacts',
  );
  const totalContacts = parseInt(countResult[0].cnt, 10);

  // Resume 모드: 이미 인덱싱된 문서 수만큼 건너뛰기
  let startOffset = 0;
  if (resume) {
    try {
      const esCount = await esClient.count({ index: 'contacts' });
      startOffset = esCount.count;
      console.log(`  ⏩ Resume 모드: ${startOffset.toLocaleString()}건 건너뛰기`);
    } catch {
      console.log('  ⚠️  ES 인덱스가 없어 처음부터 시작');
    }
  }

  const remaining = totalContacts - startOffset;
  console.log(`  총 ${remaining.toLocaleString()}건 동기화 예정`);

  if (remaining <= 0) {
    console.log('  ✅ 이미 모든 문서가 동기화됨');
    return;
  }

  const startTime = Date.now();
  const ES_BATCH = 5000;

  for (let offset = startOffset; offset < totalContacts; offset += ES_BATCH) {
    // Contact + 커스텀 필드 값 조회 (새 테이블 구조)
    const contacts: ContactRow[] = await dataSource.query(
      `
      SELECT
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        c.created_at as createdAt,
        c.updated_at as updatedAt,
        GROUP_CONCAT(
          CONCAT(
            cfd.api_name, ':',
            cfd.data_type, ':',
            COALESCE(cfv.value, '')
          )
          SEPARATOR '||'
        ) as custom_fields_raw
      FROM contacts c
      LEFT JOIN custom_field_values cfv ON cfv.record_id = c.id
      LEFT JOIN custom_field_definitions cfd ON cfd.id = cfv.field_id
      GROUP BY c.id
      LIMIT ?, ?
    `,
      [offset, ES_BATCH],
    );

    if (contacts.length === 0) break;

    // ES 벌크 요청 구성
    const operations = contacts.flatMap((contact: ContactRow) => {
      const customFields: Record<string, string | number | null> = {};

      if (contact.custom_fields_raw) {
        const entries = contact.custom_fields_raw.split('||');
        for (const entry of entries) {
          // 형식: apiName:dataType:value
          const colonIdx = entry.indexOf(':');
          const secondColonIdx = entry.indexOf(':', colonIdx + 1);
          if (colonIdx > 0 && secondColonIdx > colonIdx) {
            const apiName = entry.substring(0, colonIdx);
            const dataType = entry.substring(colonIdx + 1, secondColonIdx);
            const rawValue = entry.substring(secondColonIdx + 1);

            if (rawValue) {
              // number 타입은 숫자로 변환
              if (dataType === 'number') {
                customFields[apiName] = parseFloat(rawValue);
              } else {
                customFields[apiName] = rawValue;
              }
            }
          }
        }
      }

      return [
        { index: { _index: 'contacts', _id: contact.id } },
        {
          id: contact.id,
          name: `${contact.first_name} ${contact.last_name}`,
          email: contact.email,
          createdAt: contact.createdAt,
          updatedAt: contact.updatedAt,
          customFields,
        },
      ];
    });

    await esClient.bulk({ operations, refresh: false });
    showProgress(
      Math.min(offset + ES_BATCH, totalContacts),
      totalContacts,
      '  ES Bulk',
    );
  }

  // 리프레시 활성화 및 실행
  console.log('\n  리프레시 중...');
  await esClient.indices.putSettings({
    index: 'contacts',
    settings: { refresh_interval: '1s' },
  });
  await esClient.indices.refresh({ index: 'contacts' });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  ✅ ES 동기화 완료 (${elapsed}초)`);
}

// 메인 함수
async function main(): Promise<void> {
  console.log('🚀 시딩 스크립트 시작');
  console.log(`   - Contacts: ${CONFIG.CONTACTS_COUNT.toLocaleString()}건`);
  console.log(`   - Batch Size: ${CONFIG.BATCH_SIZE.toLocaleString()}`);
  console.log(`   - Skip ES: ${CONFIG.SKIP_ES}`);
  console.log(`   - ES Only: ${CONFIG.ES_ONLY}`);
  console.log(`   - Resume: ${CONFIG.RESUME}`);

  const dataSource = createDataSource();
  const esClient = createEsClient();

  try {
    await dataSource.initialize();
    console.log('\n✅ MySQL 연결 성공');

    if (!CONFIG.ES_ONLY) {
      // 기존 데이터 삭제 (테이블이 없으면 무시)
      console.log('\n🗑️  기존 데이터 삭제...');
      try {
        await dataSource.query('DELETE FROM custom_field_values');
        await dataSource.query('DELETE FROM contacts');
        await dataSource.query('DELETE FROM custom_field_definitions');
        console.log('  ✅ 기존 데이터 삭제 완료');
      } catch {
        console.log('  ⚠️  테이블이 없거나 이미 비어있음 (무시)');
      }

      // 필드 정의 시딩
      const fieldIdMap = await seedFieldDefinitions(dataSource);

      // Contact 시딩
      await seedContacts(dataSource, fieldIdMap);
    }

    if (!CONFIG.SKIP_ES) {
      // ES 인덱스 생성 및 동기화
      await createEsIndex(esClient, CONFIG.RESUME);
      await syncToEs(dataSource, esClient, CONFIG.RESUME);
    }

    // 결과 요약
    console.log('\n📊 시딩 완료 요약:');

    const contactCount: CountRow[] = await dataSource.query(
      'SELECT COUNT(*) as cnt FROM contacts',
    );
    const defCount: CountRow[] = await dataSource.query(
      'SELECT COUNT(*) as cnt FROM custom_field_definitions',
    );
    const fieldValueCount: CountRow[] = await dataSource.query(
      'SELECT COUNT(*) as cnt FROM custom_field_values',
    );

    console.log(
      `   - Contacts: ${parseInt(contactCount[0].cnt, 10).toLocaleString()}건`,
    );
    console.log(
      `   - Field Definitions: ${parseInt(defCount[0].cnt, 10).toLocaleString()}건`,
    );
    console.log(
      `   - Field Values: ${parseInt(fieldValueCount[0].cnt, 10).toLocaleString()}건`,
    );

    if (!CONFIG.SKIP_ES) {
      const esCount = await esClient.count({ index: 'contacts' });
      console.log(`   - ES Documents: ${esCount.count.toLocaleString()}건`);
    }
  } catch (error) {
    console.error('\n❌ 에러 발생:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('\n👋 완료!');
  }
}

void main();
