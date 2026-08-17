import { Telegraf } from "telegraf";

import { TelegramService } from "../../services";
import {
  buildSubscriptionMarkupKeyboard,
  GameService,
  getKeySubscriptionFromKeyboardCallback,
  NewsSubscriptionService,
  NewsSubscriptionsSettings,
  setSubscriptionContextStateDefault,
  setSubscriptionsSessionState,
} from "../../modules";

import { buildGamePaginationMarkUp } from "../../shared";

import { Command, IBotContext } from "../../context";

export class GameSubscriptionCommand extends Command {
  constructor(
    readonly bot: Telegraf<IBotContext>,
    private readonly gameService: GameService,
    private readonly newsSubscriptionService: NewsSubscriptionService,
    private readonly telegramService: TelegramService,
  ) {
    super(bot);
  }

  handle(): void {
    this.bot.action("game_subscription_start", async (context: IBotContext) => {
      const games = await this.gameService.getUserAllGames(
        context.session.user!.userId,
      );

      if (!games?.length)
        return this.telegramService.notifyUserAboutError(
          context,
          "В списке отслеживаемого ничего не найдено",
        );

      setSubscriptionContextStateDefault(context, "game");

      const markup = buildGamePaginationMarkUp(games, 0, "game_subscription");

      await this.telegramService.sendAndTrackMessage(
        context,
        "📰 *Выберите игру:*",
        "gameSubscriptionsMessageId",
        markup,
      );
    });

    this.bot.action(
      /^game_subscription_select:(\d+)$/,
      async (context: IBotContext) => {
        const gameId = Number(context.match?.[1]);

        const game = await this.gameService.getUserGame(gameId);

        if (!game)
          return this.telegramService.notifyUserAboutError(
            context,
            "Произошла ошибка с поиском игры.",
          );

        const gameSubscriptionSettings =
          await this.newsSubscriptionService.getGameSubscriptions(
            context.session.user!.id,
            game.id,
          );

        if (gameSubscriptionSettings)
          setSubscriptionsSessionState(
            context,
            "game",
            gameSubscriptionSettings,
          );

        context.deleteMessage(
          context.session.messagesId.gameSubscriptionsMessageId.shift(),
        );

        context.session.selectedGame = game;

        await this.telegramService.sendAndTrackMessage(
          context,
          "Выберите категории новостей, которые будете получать.",
          "gameSubscriptionsMessageId",
          buildSubscriptionMarkupKeyboard(context, "game"),
        );
      },
    );

    this.bot.action(
      /^game_subscription_toggle_page:(\d+)$/,
      async (context: IBotContext) => {
        const page = Number(context.match?.[1]);

        const games = await this.gameService.getUserAllGames(
          context.session.user!.userId,
        );

        await context.editMessageReplyMarkup(
          buildGamePaginationMarkUp(games, page, "game_subscription")
            .reply_markup,
        );

        await context.answerCbQuery();
      },
    );

    this.bot.action(
      /^game_subscription_toggle_(.+)$/,
      async (context: IBotContext) => {
        const key = getKeySubscriptionFromKeyboardCallback(
          context,
        ) as keyof NewsSubscriptionsSettings;

        if (!key)
          return this.telegramService.notifyUserAboutError(
            context,
            "Произошла ошибка при получении id кнопки",
          );

        context.session.subscriptionDraft.game[key] =
          !context.session.subscriptionDraft.game[key];

        await context.editMessageReplyMarkup(
          buildSubscriptionMarkupKeyboard(context, "game").reply_markup,
        );
      },
    );

    this.bot.action("game_subscription_save", async (context: IBotContext) => {
      if (!context.session.selectedGame)
        return this.telegramService.notifyUserAboutError(
          context,
          "Произошла ошибка с поиском игры.",
        );

      await this.newsSubscriptionService.upsertGameSubscription(
        context.session.user!,
        context.session.selectedGame.id,
        context.session.subscriptionDraft.game,
      );

      await context.deleteMessages(
        context.session.messagesId.gameSubscriptionsMessageId,
      );

      await this.telegramService.sendAndDeleteWithTimeout(
        context,
        "Успешно сохранено.",
      );
    });

    this.bot.action(
      "game_subscription_cancel",
      async (context: IBotContext) => {
        await this.telegramService.cancelOperationMessage(
          context,
          "gameSubscriptionsMessageId",
          null,
        );
      },
    );

    this.bot.action(
      "game_subscription_delete",
      async (context: IBotContext) => {
        await this.newsSubscriptionService.deleteGameSubscription(
          context.session.user!.id,
          context.session.selectedGame!.id,
        );

        await context.deleteMessages(
          context.session.messagesId.gameSubscriptionsMessageId,
        );

        await this.telegramService.sendAndDeleteWithTimeout(
          context,
          "Успешно сохранено.\nТеперь новости по этой игре будут приходить согласно глобальным настройкам.",
        );
      },
    );
  }
}
