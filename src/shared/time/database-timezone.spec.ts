import {
  buildSetDatabaseTimeZoneSql,
  DEFAULT_DATABASE_TIME_ZONE,
  getDatabaseTimeZone
} from './database-timezone';

describe('database-timezone helpers', () => {
  const originalTimeZone = process.env.APP_TIME_ZONE;

  afterEach(() => {
    if (originalTimeZone === undefined) {
      delete process.env.APP_TIME_ZONE;
      return;
    }

    process.env.APP_TIME_ZONE = originalTimeZone;
  });

  it('uses east-8 as default database time zone', () => {
    delete process.env.APP_TIME_ZONE;

    expect(getDatabaseTimeZone()).toBe(DEFAULT_DATABASE_TIME_ZONE);
    expect(buildSetDatabaseTimeZoneSql()).toBe("SET time_zone = '+08:00'");
  });

  it('supports overriding the runtime database time zone via env', () => {
    process.env.APP_TIME_ZONE = '+09:00';

    expect(getDatabaseTimeZone()).toBe('+09:00');
    expect(buildSetDatabaseTimeZoneSql()).toBe("SET time_zone = '+09:00'");
  });
});
