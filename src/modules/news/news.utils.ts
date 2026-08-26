import { Markup } from "telegraf";
import {
  GameNewsInfo,
  GameNewsSubscription,
  News,
  NEWS_RULES,
  NewsItem,
  NewsType,
  UserNewsSubscription,
} from "..";
import { buildPaginationButtons } from "../../shared";
import { CommandActionName } from "../../context";

const NEWS_PER_PAGE = 5;

export function filterRelevantNews(
  news: GameNewsInfo,
  subscriptions: GameNewsSubscription | UserNewsSubscription,
): GameNewsInfo {
  return {
    appnews: {
      ...news.appnews,
      newsitems: news.appnews.newsitems.filter((item) =>
        Object.entries({
          [NewsType.PATCHES]: subscriptions.patches,
          [NewsType.DEV_DIARY]: subscriptions.devDiary,
          [NewsType.DISCOUNTS]: subscriptions.discounts,
          [NewsType.ANNOUNCEMENTS]: subscriptions.announcements,
        }).some(
          ([category, enabled]) =>
            enabled && hasCategory(item, category as NewsType),
        ),
      ),
    },
  };
}

export async function compareNewNews(
  filteredCurrentNews: GameNewsInfo,
  news: News[],
): Promise<GameNewsInfo> {
  const existingIds = new Set(news.map((item) => item.newsId));

  const newNewsItems = filteredCurrentNews.appnews.newsitems.filter(
    (item) => !existingIds.has(item.gid),
  );

  return {
    appnews: {
      ...filteredCurrentNews.appnews,
      newsitems: newNewsItems,
    },
  };
}

export function buildNewsPaginationMarkUp(
  news: NewsItem[],
  page: number,
  action: CommandActionName,
) {
  const start = page * NEWS_PER_PAGE;
  const pageNews = news.slice(start, start + NEWS_PER_PAGE);

  const totalPages = Math.ceil(news.length / NEWS_PER_PAGE);

  const keyboard = pageNews.map((news) => [
    Markup.button.callback(
      `🎮 ${news.title}`,
      `${action}_news_select:${news.gid}`,
    ),
  ]);

  const pagination = buildPaginationButtons(page, totalPages, action, true);

  return Markup.inlineKeyboard([...keyboard, ...pagination]);
}

function hasCategory(item: NewsItem, category: NewsType): boolean {
  const rule = NEWS_RULES[category];

  const title = item.title.toLowerCase();
  const tags = item.tags ?? [];

  return Boolean(
    rule.tags?.some((tag) => tags.includes(tag)) ||
    rule.titles?.some((keyword) => title.includes(keyword)) ||
    rule.feedNames?.includes(item.feedname) ||
    rule.feedLabels?.includes(item.feedlabel),
  );
}
