import { Inject, Injectable } from '@nestjs/common';
import { TEMPLATE_REPOSITORY } from '../repository/template-repository.interface';
import type { ITemplateRepository } from '../repository/template-repository.interface';
import { TemplateResponseDto } from '../dtos/response/template-response.dto';

@Injectable()
export class FindAllTemplatesUseCase {
  constructor(
    @Inject(TEMPLATE_REPOSITORY)
    private readonly templateRepo: ITemplateRepository,
  ) {}

  async execute(): Promise<TemplateResponseDto[]> {
    const list = await this.templateRepo.findAll();
    return list.map(({ template, itemsCount }) =>
      TemplateResponseDto.fromEntity(template, itemsCount, false),
    );
  }
}
