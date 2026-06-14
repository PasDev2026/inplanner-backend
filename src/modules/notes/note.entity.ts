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
import { TaskEntity } from '../tasks/task.entity';
import { UserEntity } from '../users/user.entity';

@Entity({ schema: 'inplanner', name: 'notes' })
export class NoteEntity {
  @PrimaryGeneratedColumn()
  id_note: number;

  @Column({ type: 'text' })
  content: string;

  @Column()
  task_id: number;

  @Index()
  @Column()
  created_by_id: number;

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
