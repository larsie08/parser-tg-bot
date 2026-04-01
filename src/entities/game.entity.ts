import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

import { User } from "./user.entity";
import { News } from "./news.entity";

@Entity()
export class Game {
  @PrimaryGeneratedColumn({ name: "game_id" })
  id!: number;

  @Column()
  name!: string;

  @Column()
  steamId!: string;

  @ManyToOne(() => User, (user) => user.games)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @OneToMany(() => News, (news) => news.game)
  news!: News[];

  @CreateDateColumn()
  createdAt!: Date;
}
