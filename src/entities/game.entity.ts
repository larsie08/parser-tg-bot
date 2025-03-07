import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Game {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  name!: string;

  @Column()
  steamId!: string;
}