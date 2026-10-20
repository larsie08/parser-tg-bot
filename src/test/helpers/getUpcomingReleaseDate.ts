const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

type ReleaseDateFormat = "date" | "coming" | "quarter" | "year";

export function getUpcomingReleaseDateForTest(
  format: ReleaseDateFormat = "date",
  daysFromToday = 2,
): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);

  const year = date.getFullYear();

  switch (format) {
    case "date":
    case "coming": {
      const formattedDate = `${date.getDate()} ${MONTHS[date.getMonth()]}, ${year}`;

      return format === "coming" ? `Coming ${formattedDate}` : formattedDate;
    }

    case "quarter": {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `Q${quarter} ${year}`;
    }

    case "year":
      return String(year);
  }
}
