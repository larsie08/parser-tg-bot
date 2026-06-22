import { AppDataSource } from "../config";
import { NewsSubscriptionsSettings } from "../context";
import { GameNewsSubscription, User } from "../entities";

export class GameNewsSubscriptionService {
  async upsertGameSubscription(
    user: User,
    gameId: number,
    subscriptionState: NewsSubscriptionsSettings,
  ): Promise<void> {
    const gameSubscriptionRepo =
      AppDataSource.getRepository(GameNewsSubscription);

    let gameSubscriptionSettings = await gameSubscriptionRepo.findOne({
      where: { user: { userId: user.userId }, game: { id: gameId } },
    });

    if (!gameSubscriptionSettings)
      gameSubscriptionSettings = gameSubscriptionRepo.create({
        user: { id: user.id },
        game: { id: gameId },
      });

    Object.assign(gameSubscriptionSettings, subscriptionState);

    await gameSubscriptionRepo.save(gameSubscriptionSettings);
  }

  async getGameSubscriptions(
    userId: number,
    gameId: number,
  ): Promise<GameNewsSubscription | null> {
    return await AppDataSource.getRepository(GameNewsSubscription).findOne({
      where: { user: { userId }, game: { id: gameId } },
    });
  }

  async deleteGameSubscription(
    userId: number,
    gameId: number,
  ): Promise<void | null> {
    const repo = AppDataSource.getRepository(GameNewsSubscription);

    const subscription = await repo.findOne({
      where: { user: { id: userId }, game: { id: gameId } },
    });

    if (!subscription) return null;

    await repo.remove(subscription);
  }
}
