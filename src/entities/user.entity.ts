import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Game } from "./game.entity";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  userName!: string;

  @ManyToMany(() => Game, (game) => game.users, {
    onDelete: "CASCADE",
  })
  @JoinTable({
    name: "user_games",
    joinColumn: {
      name: "user_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "game_id",
      referencedColumnName: "id",
    },
  })
  games!: Game[];

  @CreateDateColumn()
  createdAt!: Date;
}
