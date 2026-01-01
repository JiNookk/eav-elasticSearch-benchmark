/**
 * 100만 건 시딩 스크립트 (Salesforce 스타일)
 * EAV 패턴 vs ES 성능 비교용 데이터 생성
 *
 * 테이블 구조:
 *   - accounts: 회사 (Salesforce Account)
 *   - contacts: 고객 (Salesforce Contact)
 *   - field_definitions: 커스텀 필드 정의
 *   - field_values: 커스텀 필드 값 (EAV)
 *
 * 사용법:
 *   npx ts-node scripts/seed.ts [options]
 *
 * 옵션:
 *   --contacts=N     Contact 수 (기본: 1000000)
 *   --accounts=N     Account 수 (기본: 10000)
 *   --batch=N        배치 크기 (기본: 5000)
 *   --skip-es        ES 동기화 스킵
 *   --es-only        ES 동기화만 실행 (MySQL 시딩 스킵)
 */

import { faker } from '@faker-js/faker/locale/ko';
import { DataSource } from 'typeorm';
import { Client } from '@elastic/elasticsearch';
import { v4 as uuidv4 } from 'uuid';

// 설정
const CONFIG = {
  CONTACTS_COUNT: parseInt(process.argv.find(a => a.startsWith('--contacts='))?.split('=')[1] || '1000000', 10),
  ACCOUNTS_COUNT: parseInt(process.argv.find(a => a.startsWith('--accounts='))?.split('=')[1] || '10000', 10),
  BATCH_SIZE: parseInt(process.argv.find(a => a.startsWith('--batch='))?.split('=')[1] || '5000', 10),
  SKIP_ES: process.argv.includes('--skip-es'),
  ES_ONLY: process.argv.includes('--es-only'),
};

// 커스텀 필드 정의 (Salesforce 스타일)
// data_type: text, number, date, select, multi_select
const FIELD_DEFINITIONS = [
  { label: 'Department', apiName: 'department__c', dataType: 'select' as const, options: ['Sales', 'Marketing', 'Engineering', 'HR', 'Finance', 'Operations'] },
  { label: 'Job Title', apiName: 'job_title__c', dataType: 'select' as const, options: ['Intern', 'Associate', 'Manager', 'Director', 'VP', 'C-Level'] },
  { label: 'Annual Revenue', apiName: 'annual_revenue__c', dataType: 'number' as const, options: null },
  { label: 'Contract Start', apiName: 'contract_start__c', dataType: 'date' as const, options: null },
  { label: 'Lead Source', apiName: 'lead_source__c', dataType: 'select' as const, options: ['Web', 'Referral', 'Event', 'Cold Call', 'Partner'] },
  { label: 'Last Contact Date', apiName: 'last_contact_date__c', dataType: 'date' as const, options: null },
  { label: 'Score', apiName: 'score__c', dataType: 'number' as const, options: null },
  { label: 'Notes', apiName: 'notes__c', dataType: 'text' as const, options: null },
  { label: 'Region', apiName: 'region__c', dataType: 'select' as const, options: ['APAC', 'EMEA', 'Americas'] },
  { label: 'Tier', apiName: 'tier__c', dataType: 'select' as const, options: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'] },
];

// 산업 목록
const INDUSTRIES = ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education', 'Energy', 'Transportation'];

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
  const bar = '█'.repeat(Math.floor(percent / 2)) + '░'.repeat(50 - Math.floor(percent / 2));
  process.stdout.write(`\r${label}: [${bar}] ${percent}% (${current.toLocaleString()}/${total.toLocaleString()})`);
}

// Account 시딩
async function seedAccounts(dataSource: DataSource): Promise<string[]> {
  console.log(`\n🏢 Account 시딩 시작 (${CONFIG.ACCOUNTS_COUNT.toLocaleString()}건)...`);

  const accountIds: string[] = [];
  const startTime = Date.now();

  for (let offset = 0; offset < CONFIG.ACCOUNTS_COUNT; offset += CONFIG.BATCH_SIZE) {
    const batchSize = Math.min(CONFIG.BATCH_SIZE, CONFIG.ACCOUNTS_COUNT - offset);

    const accounts: Array<{
      id: string;
      name: string;
      industry: string;
      annualRevenue: number;
    }> = [];

    for (let i = 0; i < batchSize; i++) {
      const id = uuidv4();
      accountIds.push(id);

      accounts.push({
        id,
        name: faker.company.name(),
        industry: faker.helpers.arrayElement(INDUSTRIES),
        annualRevenue: faker.number.int({ min: 100000, max: 1000000000 }),
      });
    }

    // Account 배치 삽입
    const placeholders = accounts.map(() => '(?, ?, ?, ?, NOW(), NOW())').join(', ');
    const values = accounts.flatMap(a => [a.id, a.name, a.industry, a.annualRevenue]);
    await dataSource.query(
      `INSERT INTO accounts (id, name, industry, annual_revenue, created_at, updated_at) VALUES ${placeholders}`,
      values
    );

    showProgress(offset + batchSize, CONFIG.ACCOUNTS_COUNT, '  Accounts');
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n  ✅ Account 시딩 완료 (${elapsed}초)`);

  return accountIds;
}

// 커스텀 필드 정의 시딩
async function seedFieldDefinitions(dataSource: DataSource): Promise<Map<string, string>> {
  console.log('\n📦 필드 정의 시딩...');

  const fieldIdMap = new Map<string, string>();

  for (const def of FIELD_DEFINITIONS) {
    const id = uuidv4();
    fieldIdMap.set(def.apiName, id);

    await dataSource.query(
      `INSERT INTO field_definitions (id, label, api_name, data_type, options, is_required, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE label = VALUES(label)`,
      [id, def.label, def.apiName, def.dataType, def.options ? JSON.stringify(def.options) : null, false]
    );
  }

  // 기존 필드 ID 조회 (이미 존재하는 경우)
  const existing = await dataSource.query('SELECT id, api_name FROM field_definitions');
  for (const row of existing) {
    fieldIdMap.set(row.api_name, row.id);
  }

  console.log(`  ✅ ${FIELD_DEFINITIONS.length}개 필드 정의 완료`);
  return fieldIdMap;
}

// 랜덤 커스텀 필드 값 생성 (단일 TEXT 컬럼용)
function generateFieldValue(def: typeof FIELD_DEFINITIONS[0]): string | null {
  switch (def.dataType) {
    case 'select':
      return faker.helpers.arrayElement(def.options!);
    case 'multi_select':
      const selected = faker.helpers.arrayElements(def.options!, { min: 1, max: 3 });
      return selected.join(',');
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

// Contact + Field Values 배치 시딩
async function seedContacts(
  dataSource: DataSource,
  fieldIdMap: Map<string, string>,
  accountIds: string[]
): Promise<void> {
  console.log(`\n👥 Contact 시딩 시작 (${CONFIG.CONTACTS_COUNT.toLocaleString()}건)...`);

  const startTime = Date.now();

  for (let offset = 0; offset < CONFIG.CONTACTS_COUNT; offset += CONFIG.BATCH_SIZE) {
    const batchSize = Math.min(CONFIG.BATCH_SIZE, CONFIG.CONTACTS_COUNT - offset);

    // Contact 데이터 생성
    const contacts: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      accountId: string | null;
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
        phone: faker.phone.number(),
        accountId: faker.datatype.boolean(0.7) ? faker.helpers.arrayElement(accountIds) : null,
        status: faker.datatype.boolean(0.9) ? 'active' : 'inactive',
      });

      // 각 Contact에 대해 모든 커스텀 필드 값 생성
      for (const def of FIELD_DEFINITIONS) {
        const fieldId = fieldIdMap.get(def.apiName)!;
        const value = generateFieldValue(def);

        fieldValues.push({
          id: uuidv4(),
          recordId: contactId,
          fieldId,
          value,
        });
      }
    }

    // Contact 배치 삽입
    if (contacts.length > 0) {
      const placeholders = contacts.map(() => '(?, ?, ?, ?, ?, ?, ?, NOW(), NOW())').join(', ');
      const values = contacts.flatMap(c => [
        c.id,
        c.firstName,
        c.lastName,
        c.email,
        c.phone,
        c.accountId,
        c.status,
      ]);
      await dataSource.query(
        `INSERT INTO contacts (id, first_name, last_name, email, phone, account_id, status, created_at, updated_at) VALUES ${placeholders}`,
        values
      );
    }

    // Field Values 배치 삽입 (청크 분할)
    const FIELD_VALUES_CHUNK = 5000;
    for (let fvOffset = 0; fvOffset < fieldValues.length; fvOffset += FIELD_VALUES_CHUNK) {
      const chunk = fieldValues.slice(fvOffset, fvOffset + FIELD_VALUES_CHUNK);
      const fvPlaceholders = chunk.map(() => '(?, ?, ?, ?, NOW(), NOW())').join(', ');
      const fvValues = chunk.flatMap(fv => [
        fv.id,
        fv.recordId,
        fv.fieldId,
        fv.value,
      ]);
      await dataSource.query(
        `INSERT INTO field_values (id, record_id, field_id, value, created_at, updated_at) VALUES ${fvPlaceholders}`,
        fvValues
      );
    }

    showProgress(offset + batchSize, CONFIG.CONTACTS_COUNT, '  MySQL');
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n  ✅ MySQL 시딩 완료 (${elapsed}초)`);
}

// ES 인덱스 생성
async function createEsIndex(esClient: Client): Promise<void> {
  console.log('\n🔍 ES 인덱스 생성...');

  const indexExists = await esClient.indices.exists({ index: 'contacts' });
  if (indexExists) {
    console.log('  ⚠️  기존 인덱스 삭제 중...');
    await esClient.indices.delete({ index: 'contacts' });
  }

  await esClient.indices.create({
    index: 'contacts',
    settings: {
      number_of_shards: 1,
      number_of_replicas: 0,
      refresh_interval: '-1', // 벌크 인덱싱 중 리프레시 비활성화
      analysis: {
        tokenizer: {
          ngram_tokenizer: {
            type: 'ngram' as const,
            min_gram: 2,
            max_gram: 3,
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
        firstName: { type: 'keyword' },
        lastName: { type: 'keyword' },
        fullName: {
          type: 'keyword',
          fields: {
            search: { type: 'text', analyzer: 'ngram_analyzer' },
          },
        },
        email: { type: 'keyword' },
        phone: { type: 'keyword' },
        accountId: { type: 'keyword' },
        status: { type: 'keyword' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
        customFields: {
          properties: {
            department__c: { type: 'keyword' },
            job_title__c: { type: 'keyword' },
            annual_revenue__c: { type: 'long' },
            contract_start__c: { type: 'date' },
            lead_source__c: { type: 'keyword' },
            last_contact_date__c: { type: 'date' },
            score__c: { type: 'integer' },
            notes__c: {
              type: 'text',
              fields: { keyword: { type: 'keyword', ignore_above: 256 } },
            },
            region__c: { type: 'keyword' },
            tier__c: { type: 'keyword' },
          },
        },
      },
    },
  });

  console.log('  ✅ ES 인덱스 생성 완료');
}

// ES 동기화
async function syncToEs(dataSource: DataSource, esClient: Client): Promise<void> {
  console.log(`\n🔄 ES 동기화 시작...`);

  // 전체 Contact 수 조회
  const countResult = await dataSource.query('SELECT COUNT(*) as cnt FROM contacts');
  const totalContacts = parseInt(countResult[0].cnt, 10);

  console.log(`  총 ${totalContacts.toLocaleString()}건 동기화 예정`);

  const startTime = Date.now();
  const ES_BATCH = 2000;

  for (let offset = 0; offset < totalContacts; offset += ES_BATCH) {
    // Contact + 커스텀 필드 값 조회 (새 테이블 구조)
    const contacts = await dataSource.query(`
      SELECT
        c.id,
        c.first_name as firstName,
        c.last_name as lastName,
        c.email,
        c.phone,
        c.account_id as accountId,
        c.status,
        c.created_at as createdAt,
        c.updated_at as updatedAt,
        GROUP_CONCAT(
          CONCAT(fd.api_name, ':', COALESCE(fv.value, ''))
          SEPARATOR '||'
        ) as custom_fields_raw
      FROM contacts c
      LEFT JOIN field_values fv ON fv.record_id = c.id
      LEFT JOIN field_definitions fd ON fd.id = fv.field_id
      GROUP BY c.id
      LIMIT ?, ?
    `, [offset, ES_BATCH]);

    if (contacts.length === 0) break;

    // ES 벌크 요청 구성
    const operations = contacts.flatMap((contact: {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string | null;
      accountId: string | null;
      status: string;
      createdAt: Date;
      updatedAt: Date;
      custom_fields_raw: string | null;
    }) => {
      const customFields: Record<string, string | number | null> = {};

      if (contact.custom_fields_raw) {
        const pairs = contact.custom_fields_raw.split('||');
        for (const pair of pairs) {
          const colonIdx = pair.indexOf(':');
          if (colonIdx > 0) {
            const key = pair.substring(0, colonIdx);
            const value = pair.substring(colonIdx + 1);

            // 타입에 따라 변환
            const def = FIELD_DEFINITIONS.find(d => d.apiName === key);
            if (def) {
              if (def.dataType === 'number' && value) {
                customFields[key] = parseFloat(value);
              } else {
                customFields[key] = value || null;
              }
            }
          }
        }
      }

      return [
        { index: { _index: 'contacts', _id: contact.id } },
        {
          id: contact.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          fullName: `${contact.firstName} ${contact.lastName}`,
          email: contact.email,
          phone: contact.phone,
          accountId: contact.accountId,
          status: contact.status,
          createdAt: contact.createdAt,
          updatedAt: contact.updatedAt,
          customFields,
        },
      ];
    });

    await esClient.bulk({ operations, refresh: false });
    showProgress(Math.min(offset + ES_BATCH, totalContacts), totalContacts, '  ES Bulk');
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
  console.log('🚀 시딩 스크립트 시작 (Salesforce 스타일)');
  console.log(`   - Accounts: ${CONFIG.ACCOUNTS_COUNT.toLocaleString()}건`);
  console.log(`   - Contacts: ${CONFIG.CONTACTS_COUNT.toLocaleString()}건`);
  console.log(`   - Batch Size: ${CONFIG.BATCH_SIZE.toLocaleString()}`);
  console.log(`   - Skip ES: ${CONFIG.SKIP_ES}`);
  console.log(`   - ES Only: ${CONFIG.ES_ONLY}`);

  const dataSource = createDataSource();
  const esClient = createEsClient();

  try {
    await dataSource.initialize();
    console.log('\n✅ MySQL 연결 성공');

    let accountIds: string[] = [];

    if (!CONFIG.ES_ONLY) {
      // Account 시딩
      accountIds = await seedAccounts(dataSource);

      // 필드 정의 시딩
      const fieldIdMap = await seedFieldDefinitions(dataSource);

      // Contact 시딩
      await seedContacts(dataSource, fieldIdMap, accountIds);
    } else {
      // ES Only 모드: 기존 Account ID 조회
      const existingAccounts = await dataSource.query('SELECT id FROM accounts');
      accountIds = existingAccounts.map((a: { id: string }) => a.id);
    }

    if (!CONFIG.SKIP_ES) {
      // ES 인덱스 생성 및 동기화
      await createEsIndex(esClient);
      await syncToEs(dataSource, esClient);
    }

    // 결과 요약
    console.log('\n📊 시딩 완료 요약:');

    const accountCount = await dataSource.query('SELECT COUNT(*) as cnt FROM accounts');
    const contactCount = await dataSource.query('SELECT COUNT(*) as cnt FROM contacts');
    const fieldValueCount = await dataSource.query('SELECT COUNT(*) as cnt FROM field_values');

    console.log(`   - Accounts: ${parseInt(accountCount[0].cnt, 10).toLocaleString()}건`);
    console.log(`   - Contacts: ${parseInt(contactCount[0].cnt, 10).toLocaleString()}건`);
    console.log(`   - Field Values: ${parseInt(fieldValueCount[0].cnt, 10).toLocaleString()}건`);

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

main();
