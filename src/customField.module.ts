import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FieldDefinitionEntity } from './infrastructure/persistence/typeorm/entity/fieldDefinition.entity';
import { FieldDefinitionRepository } from './infrastructure/persistence/typeorm/repository/fieldDefinition.repository';
import { CustomFieldDefinitionService } from './application/customField/customFieldDefinition.service';
import { CustomFieldController } from './interface/http/customField/customField.controller';
import { CUSTOM_FIELD_DEFINITION_REPOSITORY } from './application/customField/port/customFieldDefinition.repository.port';

@Module({
  imports: [TypeOrmModule.forFeature([FieldDefinitionEntity])],
  controllers: [CustomFieldController],
  providers: [
    CustomFieldDefinitionService,
    {
      provide: CUSTOM_FIELD_DEFINITION_REPOSITORY,
      useClass: FieldDefinitionRepository,
    },
  ],
  exports: [CustomFieldDefinitionService, CUSTOM_FIELD_DEFINITION_REPOSITORY],
})
export class CustomFieldModule {}
