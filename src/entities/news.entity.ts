import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Game } from "./game.entity";

@Entity()
export class News {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  newsId!: string;

  @ManyToOne(() => Game, (game) => game.news)
  @JoinColumn({ name: "game_id" })
  game!: Game;

  @CreateDateColumn()
  createdAt!: Date;
}
