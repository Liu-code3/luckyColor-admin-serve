export const DEFAULT_DATABASE_TIME_ZONE = '+08:00';

export function getDatabaseTimeZone() {
  const timeZone = process.env.APP_TIME_ZONE?.trim();
  return timeZone || DEFAULT_DATABASE_TIME_ZONE;
}

export function buildSetDatabaseTimeZoneSql(timeZone = getDatabaseTimeZone()) {
  const escapedTimeZone = timeZone.replace(/'/g, "''");
  return `SET time_zone = '${escapedTimeZone}'`;
}
