import { TemplateEntity } from '../../entities/template.entity';
import { TemplateItemEntity } from '../../entities/template-item.entity';

export class TemplateItemResponseDto {
  id_item: number;
  item_name: string;
  item_description: string | null;
  position: number;
  priority: number | null;
  children: TemplateItemResponseDto[];

  static fromTree(items: TemplateItemEntity[]): TemplateItemResponseDto[] {
    return items.map((item) => {
      const dto = new TemplateItemResponseDto();
      dto.id_item = item.id_item;
      dto.item_name = item.item_name;
      dto.item_description = item.item_description;
      dto.position = item.position;
      dto.priority = item.priority;
      dto.children = TemplateItemResponseDto.fromTree(item.children ?? []);
      return dto;
    });
  }
}

export class TemplateResponseDto {
  id_template: number;
  template_name: string;
  owner_id: string;
  owner_name?: string;
  items_count: number;
  created_at: Date;
  updated_at: Date;
  items?: TemplateItemResponseDto[];

  static fromEntity(
    entity: TemplateEntity,
    itemsCount: number,
    withItems = false,
  ): TemplateResponseDto {
    const dto = new TemplateResponseDto();
    dto.id_template = entity.id_template;
    dto.template_name = entity.template_name;
    dto.owner_id = entity.owner_id;
    if (entity.owner) {
      dto.owner_name = [entity.owner.name, entity.owner.apellido_paterno]
        .filter(Boolean)
        .join(' ');
    }
    dto.items_count = itemsCount;
    dto.created_at = entity.created_at;
    dto.updated_at = entity.updated_at;
    if (withItems) {
      dto.items = TemplateItemResponseDto.fromTree(entity.items ?? []);
    }
    return dto;
  }
}
