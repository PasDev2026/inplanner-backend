import { Inject, Injectable } from '@nestjs/common';
import { TemplateEntity } from '../entities/template.entity';
import { TEMPLATE_REPOSITORY } from '../repository/template-repository.interface';
import type { ITemplateRepository } from '../repository/template-repository.interface';
import { CreateTemplateDto } from '../dtos/create-template.dto';
import { TemplateResponseDto } from '../dtos/response/template-response.dto';

@Injectable()
export class CreateTemplateUseCase {
  constructor(
    @Inject(TEMPLATE_REPOSITORY)
    private readonly templateRepo: ITemplateRepository,
  ) {}

  async execute(
    dto: CreateTemplateDto,
    ownerId: string,
  ): Promise<TemplateResponseDto> {
    const template = new TemplateEntity();
    template.template_name = dto.template_name;
    template.owner_id = ownerId;

    const saved = await this.templateRepo.create(template, dto.items);
    return TemplateResponseDto.fromEntity(saved, 0, false);
  }
}
