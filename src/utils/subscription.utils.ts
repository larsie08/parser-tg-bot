import { Markup } from "telegraf";

import { InlineKeyboardMarkup } from "telegraf/types";
import {
  IBotContext,
  NewsCommandSettingsName,
  NewsSubscriptionsSettings,
} from "../context";

export function setSubscriptionsSessionState(
  context: IBotContext,
  draftName: NewsCommandSettingsName,
  state: NewsSubscriptionsSettings,
) {
  Object.assign(context.session.subscriptionDraft[draftName], state);
}

export function buildSubscriptionMarkupKeyboard(
  context: IBotContext,
  subscriptionSettingName: NewsCommandSettingsName,
): Markup.Markup<InlineKeyboardMarkup> {
  const state = context.session.subscriptionDraft[subscriptionSettingName];

  const menuButtons = [
    [
      Markup.button.callback(
        "💾 Сохранить",
        `${subscriptionSettingName}_subscription_save`,
      ),
      Markup.button.callback(
        "❌ Отмена",
        `${subscriptionSettingName}_subscription_cancel`,
      ),
    ],
  ];

  if (subscriptionSettingName === "game")
    menuButtons.push([
      Markup.button.callback(
        "🗑️ Удалить настройки игры (Вернуться к настройкам пользователя)",
        `${subscriptionSettingName}_subscription_delete`,
      ),
    ]);

  return Markup.inlineKeyboard([
    [
      Markup.button.callback(
        `${state.patches ? "✅" : "❌"} Патчи и обновления`,
        `${subscriptionSettingName}_subscription_toggle_patches`,
      ),
    ],
    [
      Markup.button.callback(
        `${state.devDiary ? "✅" : "❌"} Дневники`,
        `${subscriptionSettingName}_subscription_toggle_devDiary`,
      ),
    ],
    [
      Markup.button.callback(
        `${state.discounts ? "✅" : "❌"} Скидки`,
        `${subscriptionSettingName}_subscription_toggle_discounts`,
      ),
    ],
    [
      Markup.button.callback(
        `${state.announcements ? "✅" : "❌"} Анонсы`,
        `${subscriptionSettingName}_subscription_toggle_announcements`,
      ),
    ],
    ...menuButtons,
  ]);
}

export function setSubscriptionContextStateDefault(
  context: IBotContext,
  draftName: NewsCommandSettingsName,
) {
  const defaultStateValue: NewsSubscriptionsSettings = {
    patches: true,
    discounts: true,
    announcements: true,
    devDiary: true,
  };

  context.session.subscriptionDraft[draftName] = defaultStateValue;
}
