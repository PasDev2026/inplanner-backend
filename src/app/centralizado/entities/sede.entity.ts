import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ schema: 'centralizado', name: 'sede' })
export class SedeEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id_sede: number;

  @Column({ length: 255, unique: true })
  nom_sede: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  hora_atencion: string;

  @Column({ default: true })
  estado: boolean;
}
