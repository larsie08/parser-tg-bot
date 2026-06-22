import { GameNewsInfo, NEWS_RULES, NewsItem, NewsType } from "../context";
import { GameNewsSubscription, News, UserNewsSubscription } from "../entities";

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
