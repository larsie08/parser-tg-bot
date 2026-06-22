import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Game, GameNewsSubscription, UserNewsSubscription } from ".";

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

  @OneToOne(
    () => UserNewsSubscription,
    (UserNewsSubscription) => UserNewsSubscription.user,
    { cascade: true },
  )
  UserNewsSubscription!: UserNewsSubscription;

  @OneToMany(() => GameNewsSubscription, (subscription) => subscription.user)
  gameSubscriptions!: GameNewsSubscription[];

  @CreateDateColumn()
  createdAt!: Date;
}
