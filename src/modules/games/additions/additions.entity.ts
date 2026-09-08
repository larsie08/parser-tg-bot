import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Game, GameMeta } from "../..";

@Entity()
export class Additions {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  steamId!: string;

  @Column()
  href!: string;

  @ManyToOne(() => Game, (game) => game.additions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "game_id" })
  game!: Game;

  @OneToOne(() => GameMeta, (meta) => meta.addition, {
    cascade: true,
    onDelete: "CASCADE",
  })
  meta!: GameMeta;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
