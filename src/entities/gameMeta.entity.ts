import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Game } from "./game.entity";

@Entity()
export class GameMeta {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => Game, (game) => game.meta, { onDelete: "CASCADE" })
  @JoinColumn({ name: "game_id" })
  game!: Game;

  @Column({ nullable: true })
  price?: string;

  @Column({ nullable: true })
  oldPrice?: string;

  @Column({ nullable: true })
  discount?: string;

  @Column({ nullable: true })
  releaseDate?: string;

  @Column({ nullable: true })
  releaseTime?: string;

  @Column({ nullable: true })
  href?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
