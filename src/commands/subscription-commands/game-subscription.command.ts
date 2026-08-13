import { Markup, Telegraf } from "telegraf";

import { GameNewsSubscriptionService, GameService } from "../../services";
import {
  buildGamePaginationMarkUp,
  buildSubscriptionMarkupKeyboard,
  cancelOperationMessage,
  getKeySubscriptionFromKeyboardCallback,
  notifyUserAboutError,
  sendAndDeleteWithTimeout,
  sendAndTrackMessage,
  setSubscriptionContextStateDefault,
  setSubscriptionsSessionState,
  showGameSelectionMenu,
} from "../../utils";

import { Command, IBotContext, NewsSubscriptionsSettings } from "../../context";

export class GameSubscriptionCommand extends Command {
  constructor(
    bot: Telegraf<IBotContext>,
    private gameService: GameService,
    private gameNewsSubscriptionService: GameNewsSubscriptionService,
  ) {
    super(bot);
  }

  handle(): void {
    this.bot.action("game_subscription_start", async (context: IBotContext) => {
      const games = await this.gameService.getUserAllGames(
        context.session.user!.userId,
      );

      if (!games?.length)
        return notifyUserAboutError(
          context,
          "В списке отслеживаемого ничего не найдено",
        );

      setSubscriptionContextStateDefault(context, "game");

      await showGameSelectionMenu(
        context,
        games,
        0,
        "gameSubscriptionsMessageId",
        "game_subscription",
      );
    });

    this.bot.action(
      /^game_subscription_select:(\d+)$/,
      async (context: IBotContext) => {
        const gameId = Number(context.match?.[1]);

        const game = await this.gameService.getUserGame(gameId);

        if (!game)
          return notifyUserAboutError(
            context,
            "Произошла ошибка с поиском игры.",
          );

        const gameSubscriptionSettings =
          await this.gameNewsSubscriptionService.getGameSubscriptions(
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

        await sendAndTrackMessage(
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
          return notifyUserAboutError(
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
        return notifyUserAboutError(
          context,
          "Произошла ошибка с поиском игры.",
        );

      await this.gameNewsSubscriptionService.upsertGameSubscription(
        context.session.user!,
        context.session.selectedGame.id,
        context.session.subscriptionDraft.game,
      );

      await context.deleteMessages(
        context.session.messagesId.gameSubscriptionsMessageId,
      );

      await sendAndDeleteWithTimeout(context, "Успешно сохранено.");
    });

    this.bot.action(
      "game_subscription_cancel",
      async (context: IBotContext) => {
        await cancelOperationMessage(
          context,
          "gameSubscriptionsMessageId",
          null,
        );
      },
    );

    this.bot.action(
      "game_subscription_delete",
      async (context: IBotContext) => {
        await this.gameNewsSubscriptionService.deleteGameSubscription(
          context.session.user!.id,
          context.session.selectedGame!.id,
        );

        await context.deleteMessages(
          context.session.messagesId.gameSubscriptionsMessageId,
        );

        await sendAndDeleteWithTimeout(
          context,
          "Успешно сохранено.\nТеперь новости по этой игре будут приходить согласно глобальным настройкам.",
        );
      },
    );
  }
}
