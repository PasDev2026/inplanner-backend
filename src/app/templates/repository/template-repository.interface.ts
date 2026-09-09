import { InjectionToken } from '@nestjs/common';
import { TemplateEntity } from '../entities/template.entity';
import { CreateTemplateItemDto } from '../dtos/create-template-item.dto';

export const TEMPLATE_REPOSITORY = 'TEMPLATE_REPOSITORY' as InjectionToken;

export interface TemplateWithCount {
  template: TemplateEntity;
  itemsCount: number;
}

export interface ITemplateRepository {
  create(
    template: TemplateEntity,
    items: CreateTemplateItemDto[],
  ): Promise<TemplateEntity>;
  findAllByOwner(ownerId: string): Promise<TemplateWithCount[]>;
  findAll(): Promise<TemplateWithCount[]>;
  findOneById(id: number): Promise<TemplateEntity | null>;
  updateName(id: number, name: string): Promise<void>;
  replaceItems(
    templateId: number,
    items: CreateTemplateItemDto[],
  ): Promise<void>;
  softDelete(id: number): Promise<void>;
}
