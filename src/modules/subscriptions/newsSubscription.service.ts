import { Repository } from "typeorm";

import { NewsSubscriptionsSettings } from "./subscription.type";
import { GameNewsSubscription, User, UserNewsSubscription } from "..";

export class NewsSubscriptionService {
  constructor(
    private readonly userSubscriptionsRepository: Repository<UserNewsSubscription>,
    private readonly gameSubscriptionsRepository: Repository<GameNewsSubscription>,
  ) {}

  async getUserSubscriptions(
    userId: number,
  ): Promise<UserNewsSubscription | null> {
    return await this.userSubscriptionsRepository.findOne({
      where: {
        user: {
          userId: userId,
        },
      },
    });
  }

  async upsertUserSubscriptions(
    userId: number,
    state: NewsSubscriptionsSettings,
  ): Promise<void | null> {
    const userSubscriptions = await this.getUserSubscriptions(userId);

    if (!userSubscriptions) return null;

    Object.assign(userSubscriptions, state);

    await this.userSubscriptionsRepository.save(userSubscriptions);
  }

  async upsertGameSubscription(
    user: User,
    gameId: number,
    subscriptionState: NewsSubscriptionsSettings,
  ): Promise<void> {
    let gameSubscriptionSettings =
      await this.gameSubscriptionsRepository.findOne({
        where: { user: { userId: user.userId }, game: { id: gameId } },
      });

    if (!gameSubscriptionSettings)
      gameSubscriptionSettings = this.gameSubscriptionsRepository.create({
        user: { id: user.id },
        game: { id: gameId },
      });

    Object.assign(gameSubscriptionSettings, subscriptionState);

    await this.gameSubscriptionsRepository.save(gameSubscriptionSettings);
  }

  async getGameSubscriptions(
    userId: number,
    gameId: number,
  ): Promise<GameNewsSubscription | null> {
    return await this.gameSubscriptionsRepository.findOne({
      where: { user: { id: userId }, game: { id: gameId } },
    });
  }

  async deleteGameSubscription(
    userId: number,
    gameId: number,
  ): Promise<void | null> {
    const subscription = await this.gameSubscriptionsRepository.findOne({
      where: { user: { id: userId }, game: { id: gameId } },
    });

    if (!subscription) return null;

    await this.gameSubscriptionsRepository.remove(subscription);
  }
}
