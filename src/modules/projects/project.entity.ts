import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { ProjectResponsibleEntity } from './project-responsible.entity';
import { TaskEntity } from '../tasks/task.entity';

@Entity({ schema: 'inplanner', name: 'projects' })
export class ProjectEntity {
  @PrimaryGeneratedColumn()
  id_project: number;

  @Column({ length: 150 })
  name_project: string;

  @Column({ type: 'text', nullable: true })
  description_project: string;

  @Column({ type: 'bigint', nullable: true })
  sede_id: number;

  @Column()
  manager_id: number;

  @Column({ type: 'timestamp', nullable: true })
  start_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  due_date: Date;

  @Column({ type: 'smallint', nullable: true })
  status: number;

  @Column({ type: 'smallint', nullable: true })
  priority: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'manager_id' })
  manager: UserEntity;

  @OneToMany(() => ProjectResponsibleEntity, pr => pr.project)
  responsibles: ProjectResponsibleEntity[];

  @OneToMany(() => TaskEntity, t => t.project)
  tasks: TaskEntity[];
}
