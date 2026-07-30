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