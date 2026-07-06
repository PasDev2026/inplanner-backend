import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('areas')
export class AreaEntity {
  @PrimaryGeneratedColumn()
  id_area: number;

  @Column({ length: 100, unique: true })
  nombre_area: string;

  @Column({ default: true })
  estado: boolean;
}
