import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TEMPLATE_REPOSITORY } from '../repository/template-repository.interface';
import type { ITemplateRepository } from '../repository/template-repository.interface';
import { UpdateTemplateDto } from '../dtos/update-template.dto';

@Injectable()
export class UpdateTemplateUseCase {
  constructor(
    @Inject(TEMPLATE_REPOSITORY)
    private readonly templateRepo: ITemplateRepository,
  ) {}

  async execute(
    id: number,
    dto: UpdateTemplateDto,
    ownerId: string,
    opts?: { isAdmin?: boolean },
  ): Promise<void> {
    const template = await this.templateRepo.findOneById(id);
    if (!template || (!opts?.isAdmin && template.owner_id !== ownerId)) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    if (dto.template_name !== undefined) {
      await this.templateRepo.updateName(id, dto.template_name);
    }
    if (dto.items !== undefined) {
      await this.templateRepo.replaceItems(id, dto.items);
    }
  }
}
