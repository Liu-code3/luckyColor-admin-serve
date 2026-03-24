import {
  buildSetDatabaseTimeZoneSql,
  DEFAULT_DATABASE_TIME_ZONE,
  getDatabaseTimeZone
} from './database-timezone';

describe('database-timezone helpers', () => {
  it('uses east-8 as default database time zone', () => {
    expect(getDatabaseTimeZone()).toBe(DEFAULT_DATABASE_TIME_ZONE);
    expect(buildSetDatabaseTimeZoneSql()).toBe("SET time_zone = '+08:00'");
  });

  it('supports overriding the runtime database time zone explicitly', () => {
    expect(getDatabaseTimeZone('+09:00')).toBe('+09:00');
    expect(buildSetDatabaseTimeZoneSql('+09:00')).toBe(
      "SET time_zone = '+09:00'"
    );
  });
});
