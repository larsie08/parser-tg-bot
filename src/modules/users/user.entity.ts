import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Game, GameNewsSubscription, Giveaway, UserNewsSubscription } from "..";

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

  @ManyToOne(
    () => Giveaway,
    (giveawayNotification) => giveawayNotification.alreadyNotifiedUsers,
  )
  giveawayNotification?: Giveaway;

  @OneToOne(
    () => UserNewsSubscription,
    (UserNewsSubscription) => UserNewsSubscription.user,
    { cascade: true },
  )
  userNewsSubscription!: UserNewsSubscription;

  @OneToMany(() => GameNewsSubscription, (subscription) => subscription.user)
  gameSubscriptions!: GameNewsSubscription[];

  @CreateDateColumn()
  createdAt!: Date;
}
