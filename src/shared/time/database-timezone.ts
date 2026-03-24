export const DEFAULT_DATABASE_TIME_ZONE = '+08:00';

export function getDatabaseTimeZone(timeZone?: string | null) {
  const normalizedTimeZone = timeZone?.trim();
  return normalizedTimeZone || DEFAULT_DATABASE_TIME_ZONE;
}

export function buildSetDatabaseTimeZoneSql(timeZone?: string | null) {
  const resolvedTimeZone = getDatabaseTimeZone(timeZone);
  const escapedTimeZone = resolvedTimeZone.replace(/'/g, "''");
  return `SET time_zone = '${escapedTimeZone}'`;
}
