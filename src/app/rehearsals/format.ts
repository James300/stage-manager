export function formatRehearsalStart(startsAt: Date, timeZone: string) {
  return {
    date: new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone,
    }).format(startsAt),
    time: new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    }).format(startsAt),
  };
}
