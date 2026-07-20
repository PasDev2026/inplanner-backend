import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { TaskEntity } from '../../../app/tasks/entities/task.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('notes')
export class NoteEntity {
  @PrimaryGeneratedColumn()
  id_note: number;

  @Column({ type: 'text' })
  content: string;

  @Column()
  task_id: number;

  @Index()
  @Column({ type: 'uuid' })
  created_by_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => TaskEntity)
  @JoinColumn({ name: 'task_id' })
  task: TaskEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: UserEntity;
}
