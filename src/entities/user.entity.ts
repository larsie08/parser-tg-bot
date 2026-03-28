import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
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

  @OneToMany(() => Game, (game) => game.user, {
    onDelete: "CASCADE",
  })
  games!: Game[];

  @CreateDateColumn()
  createdAt!: Date;
}
