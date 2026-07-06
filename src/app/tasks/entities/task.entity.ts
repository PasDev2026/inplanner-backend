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
import { ProjectEntity } from '../../../app/projects/entities/project.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { TaskAssignmentEntity } from './task-assignment.entity';
import { NoteEntity } from '../../../app/notes/entities/note.entity';

@Index('idx_tasks_project_status', ['project_id', 'status'])
@Index('idx_tasks_project_parent', ['project_id', 'parent_task_id'])
@Entity('tasks')
export class TaskEntity {
  @PrimaryGeneratedColumn()
  id_task: number;

  @Column({ length: 150 })
  task_name: string;

  @Column({ type: 'text', nullable: true })
  task_description: string;

  @Column()
  project_id: number;

  @Column({ type: 'int', nullable: true })
  parent_task_id: number;

  @Column()
  created_by_id: number;

  @Column({ type: 'int', nullable: true })
  completed_by_id: number;

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

  @ManyToOne(() => ProjectEntity, (p) => p.tasks)
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @ManyToOne(() => TaskEntity)
  @JoinColumn({ name: 'parent_task_id' })
  parentTask: TaskEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'completed_by_id' })
  completedBy: UserEntity;

  @OneToMany(() => TaskAssignmentEntity, (ta) => ta.task)
  assignments: TaskAssignmentEntity[];

  @OneToMany(() => NoteEntity, (n) => n.task)
  notes: NoteEntity[];

  @OneToMany(() => TaskEntity, (t) => t.parentTask)
  children: TaskEntity[];

  subtasks_count?: number;
}
