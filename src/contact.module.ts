import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactEntity } from './infrastructure/persistence/typeorm/entity/contact.entity';
import { CustomFieldValueEntity } from './infrastructure/persistence/typeorm/entity/customFieldValue.entity';
import { CustomFieldDefinitionEntity } from './infrastructure/persistence/typeorm/entity/customFieldDefinition.entity';
import { ContactRepository } from './infrastructure/persistence/typeorm/repository/contact.repository';
import { ContactService } from './application/contact/contact.service';
import { ContactSearchService } from './application/contact/contact-search.service';
import { ContactController } from './interface/http/contact/contact.controller';
import { SearchController } from './interface/http/search/search.controller';
import { CONTACT_REPOSITORY } from './application/contact/port/contact.repository.port';
import { CustomFieldModule } from './customField.module';
import { ElasticsearchModule } from './infrastructure/elasticsearch/elasticsearch.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ContactEntity,
      CustomFieldValueEntity,
      CustomFieldDefinitionEntity,
    ]),
    CustomFieldModule,
    ElasticsearchModule,
  ],
  controllers: [SearchController, ContactController],
  providers: [
    ContactService,
    ContactSearchService,
    {
      provide: CONTACT_REPOSITORY,
      useClass: ContactRepository,
    },
  ],
  exports: [ContactService, ContactSearchService],
})
export class ContactModule {}
