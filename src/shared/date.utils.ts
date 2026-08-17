const MONTHS: Record<string, string> = {
  Jan: "января",
  Feb: "февраля",
  Mar: "марта",
  Apr: "апреля",
  May: "мая",
  Jun: "июня",
  Jul: "июля",
  Aug: "августа",
  Sep: "сентября",
  Oct: "октября",
  Nov: "ноября",
  Dec: "декабря",
};

const QUARTERS: Record<string, string> = {
  Q1: "I квартал",
  Q2: "II квартал",
  Q3: "III квартал",
  Q4: "IV квартал",
};

export function getDaysUntilRelease(releaseDate: string): number | null {
  const release = new Date(releaseDate);

  if (Number.isNaN(release.getTime())) {
    return null;
  }

  const diff = release.getTime() - Date.now();

  if (diff <= 0) {
    return 0;
  }

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function shouldCheckSteamPage(
  lastSteamPageCheck: Date | undefined,
): boolean {
  if (!lastSteamPageCheck) {
    return true;
  }

  const DAY_MS = 24 * 60 * 60 * 1000;

  return Date.now() - lastSteamPageCheck.getTime() >= DAY_MS;
}

export function formatReleaseDate(date: string): string {
  const fullDate = date.match(/^(\d{1,2}) ([A-Za-z]{3}), (\d{4})$/);

  if (fullDate) {
    const [, day, month, year] = fullDate;

    return `${Number(day)} ${MONTHS[month]} ${year}`;
  }

  const quarterDate = date.match(/^(Q[1-4]) (\d{4})$/);

  if (quarterDate) {
    const [, quarter, year] = quarterDate;

    return `${QUARTERS[quarter]} ${year}`;
  }

  return date;
}
