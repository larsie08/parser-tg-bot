import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Game } from "../..";

@Entity()
export class News {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  newsId!: string;

  @Column({ type: "timestamptz", nullable: true })
  publishedAt!: Date;

  @ManyToOne(() => Game, (game) => game.news, { onDelete: "CASCADE" })
  @JoinColumn({ name: "game_id" })
  game!: Game;

  @CreateDateColumn()
  createdAt!: Date;
}
