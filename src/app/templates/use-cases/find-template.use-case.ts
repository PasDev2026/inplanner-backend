import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TEMPLATE_REPOSITORY } from '../repository/template-repository.interface';
import type { ITemplateRepository } from '../repository/template-repository.interface';
import { TemplateResponseDto } from '../dtos/response/template-response.dto';
import type { TemplateItemEntity } from '../entities/template-item.entity';

@Injectable()
export class FindTemplateUseCase {
  constructor(
    @Inject(TEMPLATE_REPOSITORY)
    private readonly templateRepo: ITemplateRepository,
  ) {}

  async execute(
    id: number,
    ownerId: string,
    opts?: { isAdmin?: boolean },
  ): Promise<TemplateResponseDto> {
    const template = await this.templateRepo.findOneById(id);
    if (!template || (!opts?.isAdmin && template.owner_id !== ownerId)) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    const itemsCount = this.countItems(template.items ?? []);
    return TemplateResponseDto.fromEntity(template, itemsCount, true);
  }

  private countItems(items: TemplateItemEntity[]): number {
    // ponytail: conteo sobre árbol en memoria; si los árboles crecieran,
    // cambiar por COUNT agrupado en el repositorio
    return items.reduce(
      (total, item) => total + 1 + this.countItems(item.children ?? []),
      0,
    );
  }
}
