import { GameNewsInfo, NewsItem } from "../../modules";
import { GAME } from "./games.data";

const NEWS_ARR_WITHOUT_FEED_TYPE: NewsItem[] = [
  {
    gid: "1846018067943876",
    title: "В Crimson Desert появится более продвинутый кооперативный мод",
    url: "https://steamstore-a.akamaihd.net/news/externalpost/PlayGround.ru - официальная группа/1846018067943876",
    contents:
      "Моддер ByJunter прекратил разработку своего кооперативного мода для Crimson Desert, но сообщил, что другой автор уже работает над более продвинутой версией. Подробностей о новом проекте и сроках его выхода пока нет. Первая модификация позволяла двум игрокам исследовать открытый мир вместе. В ней был...",
    feedlabel: "PlayGround.ru - официальная группа",
    date: 1791894596,
    feedname: "PlayGround.ru - официальная группа",
    feed_type: 0,
    author: "",
    is_external_url: true,
    appid: 3321460,
  },
  {
    gid: "1846018067941338",
    title: "Pearl Abyss объяснила 'низкие' оценки Crimson Desert",
    url: "https://steamstore-a.akamaihd.net/news/externalpost/Gamemag.ru/1846018067941338",
    contents:
      'Критики не получили достаточно времени, чтобы по-настоящему раскрыть для себя <strong>Crimson Desert</strong> (<a href="https://gamemag.ru/reviews/crimson-desert-pc-review"><strong>наш обзор</strong></a>), считает глава европейского подразделения <strong>Pearl Abyss Либи Пак</strong>. По её мнению, это одна из причин, по которым оценки игры — <strong>77 баллов на Metacritic</strong> — оказались ниже ожиданий разработчиков . ',
    feedlabel: "Gamemag.ru",
    date: 1791773760,
    feedname: "Gamemag.ru",
    feed_type: 0,
    author: "Deacon",
    is_external_url: true,
    appid: 3321460,
  },
];

const NEWS_ARR_WITH_FEED_TYPE: NewsItem[] = [
  {
    gid: "1844751498217378",
    title: "Patch Notes Version 2.03.02",
    url: "https://steamstore-a.akamaihd.net/news/externalpost/Gamemag.ru/1846018067941338",
    contents:
      "Fellow Greymanes, Here are the fixes and improvements that have been added this patch. Update ScheduleThe patch is rolling out across all platforms. Please refer to the Update section below to see the state of the patch for each platform. UpdateSteam (PC): Patch available now Steam (Mac): Patch avai...",
    feedlabel: "Community Announcements",
    date: 1791773760,
    feedname: "steam_community_announcements",
    feed_type: 1,
    author: "[CM] Mil",
    is_external_url: true,
    appid: 3321460,
  },
  {
    gid: "1845383656377169",
    title: "Charting the Unknown: Release Date Update",
    url: "https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1845383656377169",
    contents:
      "Hello Greymanes,We are hard at work on Crimson Desert Enhanced: Charting the Unknown to bring you new adventures to Pywel. However, we have determined that we need additional development time to deliver a more polished and stable gameplay experience. Therefore, we have decided to move the DLC's rele...",
    feedlabel: "Community Announcements",
    date: 1790766166,
    feedname: "steam_community_announcements",
    feed_type: 1,
    author: "CrimsonDesert_Official",
    is_external_url: true,
    appid: 3321460,
  },
];

export const STEAMGAMEDATA_NEWS: GameNewsInfo = {
  appnews: {
    appid: Number(GAME.steamId),
    newsitems: [...NEWS_ARR_WITHOUT_FEED_TYPE, ...NEWS_ARR_WITH_FEED_TYPE],
  },
};

export const STEAMGAMEDATA_EXPECTED_NEWS: GameNewsInfo = {
  appnews: {
    appid: Number(GAME.steamId),
    newsitems: [...NEWS_ARR_WITH_FEED_TYPE],
  },
};
