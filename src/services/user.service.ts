import { AppDataSource } from "../config";
import { Game, User } from "../entities";

export class UserService {
  async getUserWithGames(userId: number): Promise<User | null> {
    return await AppDataSource.getRepository(User).findOne({
      where: { userId },
      relations: { games: true },
    });
  }

  async getAllUsersWithGames(): Promise<User[] | null> {
    return await AppDataSource.getRepository(User).find({
      relations: { games: true },
    });
  }

  async getUser(userId: number): Promise<User | null> {
    return await AppDataSource.getRepository(User).findOneBy({ userId });
  }

  async saveUser(userId: number, userName: string): Promise<User> {
    const user = AppDataSource.getRepository(User).create({
      userId,
      userName,
    });

    return await AppDataSource.getRepository(User).save(user);
  }

  async addUserGame(user: User, game: Game): Promise<void> {
    const alreadyAdded = user.games.some((g) => g.id === game.id);

    if (alreadyAdded) return;

    user.games.push(game);
    await AppDataSource.getRepository(User).save(user);
  }

  async deleteUserGame(userId: number, game: Game): Promise<void> {
    const user = await this.getUserWithGames(userId);

    if (!user) throw new Error("При удалении игры пользователь не найден.");

    user.games = user?.games.filter((g) => g.id !== game.id);

    await AppDataSource.getRepository(User).save(user);
  }
}
