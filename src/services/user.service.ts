import { AppDataSource } from "../config/typeOrm.config";
import { Game, User, UserNewsSubscription } from "../entities";

export class UserService {
  async getUserWithGames(userId: number): Promise<User | null> {
    return await AppDataSource.getRepository(User).findOne({
      where: { userId },
      relations: { games: true },
    });
  }

  async getUser(userId: number): Promise<User | null> {
    return await AppDataSource.getRepository(User).findOneBy({ userId });
  }

  async saveUser(userId: number, userName: string): Promise<User> {
    const userRepo = AppDataSource.getRepository(User);
    const subscriptionRepo = AppDataSource.getRepository(UserNewsSubscription);

    const user = await userRepo.save(
      userRepo.create({
        userId,
        userName,
      }),
    );

    await subscriptionRepo.save(subscriptionRepo.create({ user }));

    return user;
  }

  async addUserGame(userId: number, game: Game): Promise<void> {
    const userRepo = AppDataSource.getRepository(User);

    const user = await userRepo.findOne({
      where: { userId },
      relations: { games: true },
    });

    if (!user) return;

    const alreadyAdded = user.games.some((g) => g.id === game.id);

    if (alreadyAdded) return;

    user.games.push(game);

    await userRepo.save(user);
  }

  async deleteUserGame(userId: number, game: Game): Promise<void> {
    const user = await this.getUserWithGames(userId);

    if (!user) throw new Error("При удалении игры пользователь не найден.");

    user.games = user?.games.filter((g) => g.id !== game.id);

    await AppDataSource.getRepository(User).save(user);
  }
}
