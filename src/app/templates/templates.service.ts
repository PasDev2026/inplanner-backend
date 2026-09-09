import { Injectable } from '@nestjs/common';
import { CreateTemplateUseCase } from './use-cases/create-template.use-case';
import { CreateTemplateFromTaskUseCase } from './use-cases/create-from-task.use-case';
import { FindTemplatesUseCase } from './use-cases/find-templates.use-case';
import { FindAllTemplatesUseCase } from './use-cases/find-all-templates.use-case';
import { FindTemplateUseCase } from './use-cases/find-template.use-case';
import { UpdateTemplateUseCase } from './use-cases/update-template.use-case';
import { DeleteTemplateUseCase } from './use-cases/delete-template.use-case';
import { ApplyTemplateUseCase } from './use-cases/apply-template.use-case';
import { CreateTemplateDto } from './dtos/create-template.dto';
import { UpdateTemplateDto } from './dtos/update-template.dto';
import { ApplyTemplateDto } from './dtos/apply-template.dto';
import { CreateFromTaskDto } from './dtos/create-from-task.dto';
import { TemplateResponseDto } from './dtos/response/template-response.dto';
import { TaskResponseDto } from '../tasks/dtos/response/task-response.dto';

interface AdminOptions {
  isAdmin?: boolean;
}

@Injectable()
export class TemplatesService {
  constructor(
    private readonly createTemplateUseCase: CreateTemplateUseCase,
    private readonly createTemplateFromTaskUseCase: CreateTemplateFromTaskUseCase,
    private readonly findTemplatesUseCase: FindTemplatesUseCase,
    private readonly findAllTemplatesUseCase: FindAllTemplatesUseCase,
    private readonly findTemplateUseCase: FindTemplateUseCase,
    private readonly updateTemplateUseCase: UpdateTemplateUseCase,
    private readonly deleteTemplateUseCase: DeleteTemplateUseCase,
    private readonly applyTemplateUseCase: ApplyTemplateUseCase,
  ) {}

  create(
    dto: CreateTemplateDto,
    ownerId: string,
  ): Promise<TemplateResponseDto> {
    return this.createTemplateUseCase.execute(dto, ownerId);
  }

  createFromTask(
    dto: CreateFromTaskDto,
    ownerId: string,
  ): Promise<TemplateResponseDto> {
    return this.createTemplateFromTaskUseCase.execute(
      dto.task_id,
      dto.template_name,
      ownerId,
    );
  }

  findAll(ownerId: string): Promise<TemplateResponseDto[]> {
    return this.findTemplatesUseCase.execute(ownerId);
  }

  findAllForAdmin(): Promise<TemplateResponseDto[]> {
    return this.findAllTemplatesUseCase.execute();
  }

  findOne(
    id: number,
    ownerId: string,
    opts?: AdminOptions,
  ): Promise<TemplateResponseDto> {
    return this.findTemplateUseCase.execute(id, ownerId, opts);
  }

  update(
    id: number,
    dto: UpdateTemplateDto,
    ownerId: string,
    opts?: AdminOptions,
  ): Promise<void> {
    return this.updateTemplateUseCase.execute(id, dto, ownerId, opts);
  }

  remove(id: number, ownerId: string, opts?: AdminOptions): Promise<void> {
    return this.deleteTemplateUseCase.execute(id, ownerId, opts);
  }

  async apply(
    id: number,
    dto: ApplyTemplateDto,
    userId: string,
    opts?: AdminOptions,
  ): Promise<TaskResponseDto[]> {
    const tasks = await this.applyTemplateUseCase.execute(
      id,
      dto,
      userId,
      opts,
    );
    return TaskResponseDto.fromEntityList(tasks);
  }
}
