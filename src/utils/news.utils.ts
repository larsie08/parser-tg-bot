import { GameNewsInfo, NewsItem } from "../context";
import { NewsService } from "../services";

export function filterRelevantNews(news: GameNewsInfo): GameNewsInfo {
  const allowedTags = ["patchnotes", "vo_marketing_message"];
  const allowedFeedName = ["steam_community_announcements"];
  const allowedFeedLabel = ["Community Announcements"];

  return {
    appnews: {
      ...news.appnews,
      newsitems: news.appnews.newsitems.filter((item) => {
        const hasAllowedTag =
          item.tags?.some((tag) => allowedTags.includes(tag)) ?? false;

        const hasAllowedFeed =
          allowedFeedName.includes(item.feedname) ||
          allowedFeedLabel.includes(item.feedlabel);

        return hasAllowedTag || hasAllowedFeed || item.feed_type;
      }),
    },
  };
}

export function createNewsMessage(
  currentNews: NewsItem,
  gameName: string,
  news?: NewsItem[],
): string {
  let message: string = `Название Игры: ${gameName}\nНовость: ${currentNews.title}\nТекст: ${currentNews.contents}\nСсылка: ${currentNews.url}`;

  if (news && !news.some((item) => item.gid === currentNews.gid)) {
    message = `Новая новость!\nНазвание Игры: ${gameName}\nНовость: ${currentNews.title}\nТекст: ${currentNews.contents}\nСсылка: ${currentNews.url}`;
  }

  return message;
}

export async function compareNewNews(
  news: GameNewsInfo,
  gameSteamId: string,
): Promise<GameNewsInfo> {
  const ids = news.appnews.newsitems.map((item) => item.gid);

  const existingNews = await new NewsService().getNewsGame(ids, gameSteamId);

  const existingIds = new Set(existingNews.map((item) => item.newsId));

  const newNewsItems = news.appnews.newsitems.filter(
    (item) => !existingIds.has(item.gid),
  );

  return {
    appnews: {
      ...news.appnews,
      newsitems: newNewsItems,
    },
  };
}
