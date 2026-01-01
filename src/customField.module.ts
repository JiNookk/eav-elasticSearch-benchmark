import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomFieldDefinitionEntity } from './infrastructure/persistence/typeorm/entity/customFieldDefinition.entity';
import { CustomFieldDefinitionRepository } from './infrastructure/persistence/typeorm/repository/customFieldDefinition.repository';
import { CustomFieldDefinitionService } from './application/customField/customFieldDefinition.service';
import { CustomFieldController } from './interface/http/customField/customField.controller';
import { CUSTOM_FIELD_DEFINITION_REPOSITORY } from './application/customField/port/customFieldDefinition.repository.port';

@Module({
  imports: [TypeOrmModule.forFeature([CustomFieldDefinitionEntity])],
  controllers: [CustomFieldController],
  providers: [
    CustomFieldDefinitionService,
    {
      provide: CUSTOM_FIELD_DEFINITION_REPOSITORY,
      useClass: CustomFieldDefinitionRepository,
    },
  ],
  exports: [CustomFieldDefinitionService],
})
export class CustomFieldModule {}
