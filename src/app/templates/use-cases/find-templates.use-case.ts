import { Inject, Injectable } from '@nestjs/common';
import { TEMPLATE_REPOSITORY } from '../repository/template-repository.interface';
import type { ITemplateRepository } from '../repository/template-repository.interface';
import { TemplateResponseDto } from '../dtos/response/template-response.dto';

@Injectable()
export class FindTemplatesUseCase {
  constructor(
    @Inject(TEMPLATE_REPOSITORY)
    private readonly templateRepo: ITemplateRepository,
  ) {}

  async execute(ownerId: string): Promise<TemplateResponseDto[]> {
    const list = await this.templateRepo.findAllByOwner(ownerId);
    return list.map(({ template, itemsCount }) =>
      TemplateResponseDto.fromEntity(template, itemsCount, false),
    );
  }
}
