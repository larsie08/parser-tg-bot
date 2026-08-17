import { Repository } from "typeorm";
import { Game, User, UserNewsSubscription } from "..";

export class UserService {
  constructor(
    private readonly userRepository: Repository<User>,
    private readonly userSubscriptionsRepository: Repository<UserNewsSubscription>,
  ) {}

  async getUserWithGames(userId: number): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { userId },
      relations: { games: true, UserNewsSubscription: true },
    });
  }

  async getUser(userId: number): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { userId },
      relations: { UserNewsSubscription: true },
    });
  }

  async saveUser(userId: number, userName: string): Promise<User> {
    const user = await this.userRepository.save(
      this.userRepository.create({
        userId,
        userName,
      }),
    );

    await this.userSubscriptionsRepository.save(
      this.userSubscriptionsRepository.create({ user }),
    );

    return user;
  }

  async addUserGame(userId: number, game: Game): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { userId },
      relations: { games: true },
    });

    if (!user) return;

    const alreadyAdded = user.games.some((g) => g.id === game.id);

    if (alreadyAdded) return;

    user.games.push(game);

    await this.userRepository.save(user);
  }

  async deleteUserGame(userId: number, game: Game): Promise<void> {
    const user = await this.getUserWithGames(userId);

    if (!user) throw new Error("При удалении игры пользователь не найден.");

    user.games = user?.games.filter((g) => g.id !== game.id);

    await this.userRepository.save(user);
  }
}
