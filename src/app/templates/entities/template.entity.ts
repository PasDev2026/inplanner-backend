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
import { UserEntity } from '../../users/entities/user.entity';
import { TemplateItemEntity } from './template-item.entity';

@Index('idx_templates_owner', ['owner_id'])
@Entity('templates')
export class TemplateEntity {
  @PrimaryGeneratedColumn()
  id_template: number;

  @Column({ length: 150 })
  template_name: string;

  @Column({ type: 'uuid' })
  owner_id: string;

  @Column({ default: true })
  estado: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'owner_id' })
  owner: UserEntity;

  @OneToMany(() => TemplateItemEntity, (item) => item.template)
  items: TemplateItemEntity[];
}
