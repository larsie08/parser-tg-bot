import { AppDataSource } from "../config";

import { NewsSubscriptionsSettings } from "../context";
import { UserNewsSubscription } from "../entities";

export class UserNewsSubscriptionService {
  async getUserSubscriptions(
    userId: number,
  ): Promise<UserNewsSubscription | null> {
    return await AppDataSource.getRepository(UserNewsSubscription).findOne({
      where: {
        user: {
          userId: userId,
        },
      },
    });
  }

  async saveUserSubscriptions(
    userId: number,
    state: NewsSubscriptionsSettings,
  ): Promise<void | null> {
    const userSubscriptions = await this.getUserSubscriptions(userId);

    if (!userSubscriptions) return null;

    Object.assign(userSubscriptions, state);

    await AppDataSource.getRepository(UserNewsSubscription).save(
      userSubscriptions,
    );
  }
}
