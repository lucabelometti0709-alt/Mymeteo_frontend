const weekdayFormatter = new Intl.DateTimeFormat("it-IT", {
  weekday: "short",
  timeZone: "UTC",
});

const fullDateFormatter = new Intl.DateTimeFormat("it-IT", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  timeZone: "UTC",
});

const timeFormatter = new Intl.DateTimeFormat("it-IT", {
  hour: "2-digit",
  minute: "2-digit",
});

function parseDateOnly(date) {
  return new Date(`${date}T12:00:00Z`);
}

export function formatWeekday(date) {
  return weekdayFormatter.format(parseDateOnly(date)).replace(".", "");
}

export function formatReadableDate(date) {
  return fullDateFormatter.format(parseDateOnly(date));
}

export function formatHour(dateTime) {
  if (!dateTime) {
    return "--:--";
  }

  return timeFormatter.format(new Date(dateTime));
}

export function formatDashboardDate(date = rawData.current?.time
  ? new Date(rawData.current.time)
  : new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

export function formatDashboardTime(date = new Date()) {
  return timeFormatter.format(date);
}
