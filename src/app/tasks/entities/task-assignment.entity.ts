import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TaskEntity } from './task.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('task_assignments')
export class TaskAssignmentEntity {
  @PrimaryColumn()
  task_id: number;

  @PrimaryColumn()
  user_id: number;

  @ManyToOne(() => TaskEntity, (t) => t.assignments)
  @JoinColumn({ name: 'task_id' })
  task: TaskEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
