import { AppDataSource } from "../config";
import { User } from "../entities";

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

  async getUser(id: number): Promise<User | null> {
    return await AppDataSource.getRepository(User).findOneBy({ userId: id });
  }

  async saveUser(userId: number, userName: string): Promise<User> {
    const user = AppDataSource.getRepository(User).create({
      userId,
      userName,
    });

    return await AppDataSource.getRepository(User).save(user);
  }
}
