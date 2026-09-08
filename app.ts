import "reflect-metadata";
import { session, Telegraf } from "telegraf";

import { AutoParserJob, NotificationJob } from "./src/bot/jobs";
import {
  ParserCommand,
  StartCommand,
  GameAddCommand,
  GameDeleteCommand,
  GameNewsCommand,
  GlobalSubscriptionCommand,
  GameSubscriptionCommand,
  GameReleasesCommand,
} from "./src/bot/commands";

import {
  Additions,
  AdditionsService,
  Game,
  GameMeta,
  GameMetaService,
  GameNewsSubscription,
  GameService,
  News,
  NewsService,
  NewsSubscriptionService,
  NewsType,
  User,
  UserNewsSubscription,
  UserService,
} from "./src/modules";
import { TelegramService } from "./src/bot/telegram.service";
import { SteamService } from "./src/integrations";

import { Command, IBotContext } from "./src/context";
import { AppDataSource, ConfigService, IConfigService } from "./src/config";

class Bot {
  bot: Telegraf<IBotContext>;
  commands: Command[] = [];

  constructor(private readonly ConfigService: IConfigService) {
    this.bot = new Telegraf<IBotContext>(this.ConfigService.get("TOKEN"));

    this.bot.use(
      session({
        defaultSession: () => ({
          state: null,
          parserSelectedGame: null,
          pendingGame: [],
          messagesId: {
            gameMenuCommandMessageId: [],

            gameAddMessagesId: [],
            gameDeleteMessagesId: [],

            gameNewsMessagesId: [],
            gameParserMessageId: [],
            gameReleasesMessageId: [],

            userSubscriptionsMessageId: [],
            gameSubscriptionsMessageId: [],
          },
          lastAskNextGameMessageId: null,
          subscriptionDraft: {
            global: {
              [NewsType.PATCHES]: true,
              [NewsType.DISCOUNTS]: true,
              [NewsType.ANNOUNCEMENTS]: true,
              [NewsType.DEV_DIARY]: true,
            },
            game: {
              [NewsType.PATCHES]: true,
              [NewsType.DISCOUNTS]: true,
              [NewsType.ANNOUNCEMENTS]: true,
              [NewsType.DEV_DIARY]: true,
            },
          },
          user: null,
          selectedGame: null,
          filteredNews: null,
        }),
      }),
    );
  }

  init() {
    const gameRepository = AppDataSource.getRepository(Game);
    const gameMetaRepository = AppDataSource.getRepository(GameMeta);
    const additionsRepository = AppDataSource.getRepository(Additions);
    const newsRepository = AppDataSource.getRepository(News);
    const userRepository = AppDataSource.getRepository(User);
    const userSubscriptionRepository =
      AppDataSource.getRepository(UserNewsSubscription);
    const gameSubscriptionRepository =
      AppDataSource.getRepository(GameNewsSubscription);

    const gameService = new GameService(gameRepository);
    const gameMetaService = new GameMetaService(gameMetaRepository);
    const additionsService = new AdditionsService(
      additionsRepository,
      gameMetaRepository,
    );
    const newsService = new NewsService(newsRepository);
    const userService = new UserService(
      userRepository,
      userSubscriptionRepository,
    );
    const newsSubscriptionService = new NewsSubscriptionService(
      userSubscriptionRepository,
      gameSubscriptionRepository,
    );
    const steamService = new SteamService();
    const telegramService = new TelegramService(this.bot);

    this.commands = [
      new StartCommand(this.bot, userService, telegramService),

      new AutoParserJob(
        this.bot,
        gameService,
        gameMetaService,
        newsService,
        steamService,
        telegramService,
        additionsService,
      ),
      new NotificationJob(this.bot, gameMetaService, telegramService),

      new GameAddCommand(
        this.bot,
        userService,
        gameService,
        steamService,
        telegramService,
      ),
      new GameDeleteCommand(
        this.bot,
        userService,
        gameService,
        telegramService,
      ),

      new ParserCommand(
        this.bot,
        gameMetaService,
        gameService,
        steamService,
        telegramService,
      ),
      new GameNewsCommand(
        this.bot,
        newsService,
        gameService,
        steamService,
        telegramService,
      ),
      new GameReleasesCommand(
        this.bot,
        gameMetaService,
        steamService,
        telegramService,
      ),

      new GlobalSubscriptionCommand(
        this.bot,
        newsSubscriptionService,
        telegramService,
      ),
      new GameSubscriptionCommand(
        this.bot,
        gameService,
        newsSubscriptionService,
        telegramService,
      ),
    ];

    for (const command of this.commands) {
      command.handle();
    }
    this.bot.launch();
  }
}

const bot = new Bot(new ConfigService());

AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
    bot.init();
  })
  .catch((error) =>
    console.error("Error during Data Source initialization:", error),
  );
