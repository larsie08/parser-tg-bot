import { GameNewsInfo, NewsItem } from "../context";
import { News } from "../entities";
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
