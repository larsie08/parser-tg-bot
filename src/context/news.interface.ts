export enum NewsType {
  PATCHES = "patches",
  DISCOUNTS = "discounts",
  ANNOUNCEMENTS = "announcements",
  DEV_DIARY = "devDiary",
}

export type NewsSubscriptionsSettings = Record<NewsType, boolean>;

export const NEWS_RULES: Record<
  NewsType,
  {
    tags?: string[];
    titles?: string[];
    feedNames?: string[];
    feedLabels?: string[];
  }
> = {
  [NewsType.PATCHES]: {
    tags: ["patchnotes", "mod_reviewed"],
    titles: ["patch", "hotfix", "update"],
  },
  [NewsType.DEV_DIARY]: {
    titles: ["developer diary", "dev diary", "devlog"],
  },

  [NewsType.DISCOUNTS]: {
    tags: ["hide_store"],
    titles: ["sale", "discount", "%", "save"],
  },

  [NewsType.ANNOUNCEMENTS]: {
    tags: ["vo_marketing_message"],
    feedNames: ["steam_community_announcements"],
    feedLabels: ["Community Announcements"],
  },
};

export type NewsItem = {
  gid: string;
  contents: string;
  title: string;
  url: string;
  feed_type: number;
  feedname: string;
  feedlabel: string;
  tags: string[];
};

export type GameNewsInfo = {
  appnews: {
    appid: number;
    newsitems: NewsItem[];
  };
};

export type FilteredUsersNewsPreference = {
  userId: number;
  news: GameNewsInfo;
};
