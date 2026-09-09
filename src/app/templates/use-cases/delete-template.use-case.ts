import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TEMPLATE_REPOSITORY } from '../repository/template-repository.interface';
import type { ITemplateRepository } from '../repository/template-repository.interface';

@Injectable()
export class DeleteTemplateUseCase {
  constructor(
    @Inject(TEMPLATE_REPOSITORY)
    private readonly templateRepo: ITemplateRepository,
  ) {}

  async execute(
    id: number,
    ownerId: string,
    opts?: { isAdmin?: boolean },
  ): Promise<void> {
    const template = await this.templateRepo.findOneById(id);
    if (!template || (!opts?.isAdmin && template.owner_id !== ownerId)) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    await this.templateRepo.softDelete(id);
  }
}
