import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TemplateEntity } from '../entities/template.entity';
import { TemplateItemEntity } from '../entities/template-item.entity';
import { CreateTemplateItemDto } from '../dtos/create-template-item.dto';
import type {
  ITemplateRepository,
  TemplateWithCount,
} from '../repository/template-repository.interface';

@Injectable()
export class TemplateTypeormRepository implements ITemplateRepository {
  constructor(
    @InjectRepository(TemplateEntity)
    private readonly repo: Repository<TemplateEntity>,
    @InjectRepository(TemplateItemEntity)
    private readonly itemRepo: Repository<TemplateItemEntity>,
  ) {}

  async create(
    template: TemplateEntity,
    items: CreateTemplateItemDto[],
  ): Promise<TemplateEntity> {
    return this.repo.manager.transaction(async (em) => {
      const saved = await em.save(template);
      await this.insertItemTree(em, saved.id_template, null, items);
      return saved;
    });
  }

  async findAllByOwner(ownerId: string): Promise<TemplateWithCount[]> {
    const templates = await this.repo.find({
      where: { owner_id: ownerId, estado: true },
      order: { created_at: 'DESC' },
    });
    return this.attachItemsCount(templates);
  }

  async findAll(): Promise<TemplateWithCount[]> {
    const templates = await this.repo.find({
      where: { estado: true },
      relations: { owner: true },
      order: { created_at: 'DESC' },
    });
    return this.attachItemsCount(templates);
  }

  private async attachItemsCount(
    templates: TemplateEntity[],
  ): Promise<TemplateWithCount[]> {
    const ids = templates.map((t) => t.id_template);
    if (ids.length === 0) return [];

    type RawCount = { template_id: number; cnt: string };
    const counts = await this.itemRepo
      .createQueryBuilder('item')
      .select('item.template_id', 'template_id')
      .addSelect('COUNT(*)', 'cnt')
      .where('item.template_id IN (:...ids)', { ids })
      .groupBy('item.template_id')
      .getRawMany<RawCount>();

    const countMap = new Map<number, number>(
      counts.map((c: RawCount) => [Number(c.template_id), Number(c.cnt)]),
    );

    return templates.map((template) => ({
      template,
      itemsCount: countMap.get(template.id_template) ?? 0,
    }));
  }

  async findOneById(id: number): Promise<TemplateEntity | null> {
    const template = await this.repo.findOne({
      where: { id_template: id, estado: true },
    });
    if (!template) return null;

    const items = await this.itemRepo.find({
      where: { template_id: id },
      order: { position: 'ASC' },
    });
    template.items = this.buildTree(items);
    return template;
  }

  async updateName(id: number, name: string): Promise<void> {
    await this.repo.update(id, { template_name: name });
  }

  async replaceItems(
    templateId: number,
    items: CreateTemplateItemDto[],
  ): Promise<void> {
    await this.repo.manager.transaction(async (em) => {
      await em.delete(TemplateItemEntity, { template_id: templateId });
      await this.insertItemTree(em, templateId, null, items);
    });
  }

  async softDelete(id: number): Promise<void> {
    await this.repo.update(id, { estado: false });
  }

  // ponytail: inserts item por item (N queries) dentro de la transacción;
  // batch con recursion de ids si el volumen de items llegara a importar
  private async insertItemTree(
    em: EntityManager,
    templateId: number,
    parentId: number | null,
    items: CreateTemplateItemDto[],
  ): Promise<void> {
    for (const [index, item] of items.entries()) {
      const entity = new TemplateItemEntity();
      entity.template_id = templateId;
      entity.parent_item_id = parentId;
      entity.item_name = item.item_name;
      entity.item_description = item.item_description ?? null;
      entity.position = item.position ?? (index + 1) * 1000;
      entity.priority = item.priority ?? null;
      const saved = await em.save(entity);
      if (item.children?.length) {
        await this.insertItemTree(em, templateId, saved.id_item, item.children);
      }
    }
  }

  private buildTree(items: TemplateItemEntity[]): TemplateItemEntity[] {
    const byId = new Map<number, TemplateItemEntity>(
      items.map((item) => [item.id_item, item]),
    );
    for (const item of items) {
      item.children = [];
    }
    const roots: TemplateItemEntity[] = [];
    for (const item of items) {
      if (item.parent_item_id === null) {
        roots.push(item);
      } else {
        byId.get(item.parent_item_id)?.children?.push(item);
      }
    }
    return roots;
  }
}
