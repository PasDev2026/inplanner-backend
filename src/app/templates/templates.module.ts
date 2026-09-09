import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplateEntity } from './entities/template.entity';
import { TemplateItemEntity } from './entities/template-item.entity';
import { TEMPLATE_REPOSITORY } from './repository/template-repository.interface';
import { TemplateTypeormRepository } from './persistence/template.typeorm.repository';
import { CreateTemplateUseCase } from './use-cases/create-template.use-case';
import { CreateTemplateFromTaskUseCase } from './use-cases/create-from-task.use-case';
import { FindTemplatesUseCase } from './use-cases/find-templates.use-case';
import { FindAllTemplatesUseCase } from './use-cases/find-all-templates.use-case';
import { FindTemplateUseCase } from './use-cases/find-template.use-case';
import { UpdateTemplateUseCase } from './use-cases/update-template.use-case';
import { DeleteTemplateUseCase } from './use-cases/delete-template.use-case';
import { ApplyTemplateUseCase } from './use-cases/apply-template.use-case';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TemplateEntity, TemplateItemEntity]),
    TasksModule,
  ],
  controllers: [TemplatesController],
  providers: [
    { provide: TEMPLATE_REPOSITORY, useClass: TemplateTypeormRepository },
    CreateTemplateUseCase,
    CreateTemplateFromTaskUseCase,
    FindTemplatesUseCase,
    FindAllTemplatesUseCase,
    FindTemplateUseCase,
    UpdateTemplateUseCase,
    DeleteTemplateUseCase,
    ApplyTemplateUseCase,
    TemplatesService,
  ],
})
export class TemplatesModule {}
