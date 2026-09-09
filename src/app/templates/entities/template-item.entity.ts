import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { TemplateEntity } from './template.entity';

@Index('idx_template_items_template', ['template_id'])
@Index('idx_template_items_parent', ['parent_item_id'])
@Entity('template_items')
export class TemplateItemEntity {
  @PrimaryGeneratedColumn()
  id_item: number;

  @Column()
  template_id: number;

  @Column({ type: 'int', nullable: true })
  parent_item_id: number | null;

  @Column({ length: 150 })
  item_name: string;

  @Column({ type: 'text', nullable: true })
  item_description: string | null;

  @Column({ type: 'double precision', default: 1000 })
  position: number;

  @Column({ type: 'smallint', nullable: true })
  priority: number | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => TemplateEntity, (t) => t.items)
  @JoinColumn({ name: 'template_id' })
  template: TemplateEntity;

  @ManyToOne(() => TemplateItemEntity)
  @JoinColumn({ name: 'parent_item_id' })
  parentItem: TemplateItemEntity;

  @OneToMany(() => TemplateItemEntity, (item) => item.parentItem)
  children: TemplateItemEntity[];
}
