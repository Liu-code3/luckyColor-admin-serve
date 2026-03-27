import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('schema index design', () => {
  const schema = readFileSync(
    resolve(process.cwd(), 'prisma/schema.prisma'),
    'utf8'
  );

  it('keeps tenant code, role code, and username lookups indexed by unique constraints', () => {
    expect(schema).toMatch(/model Tenant[\s\S]*code\s+String\s+@unique/);
    expect(schema).toMatch(/model User[\s\S]*@@unique\(\[tenantId,\s*username\]\)/);
    expect(schema).toMatch(/model Role[\s\S]*@@unique\(\[tenantId,\s*code\]\)/);
  });

  it('keeps menu permission and menu key lookups indexed', () => {
    expect(schema).toMatch(/model Menu[\s\S]*@@unique\(\[menuKey\]\)/);
    expect(schema).toMatch(/model Menu[\s\S]*@@index\(\[permissionCode\]\)/);
    expect(schema).toMatch(/model Menu[\s\S]*@@index\(\[parentId,\s*sort\]\)/);
  });

  it('keeps department hierarchy queries indexed inside tenant scope', () => {
    expect(schema).toMatch(/model Department[\s\S]*@@index\(\[tenantId,\s*parentId\]\)/);
    expect(schema).toMatch(
      /model Department[\s\S]*@@index\(\[tenantId,\s*parentId,\s*sort\]\)/
    );
  });

  it('keeps high-frequency list queries covered by composite indexes', () => {
    expect(schema).toMatch(/model User[\s\S]*@@index\(\[tenantId,\s*status,\s*createdAt\]\)/);
    expect(schema).toMatch(/model Role[\s\S]*@@index\(\[tenantId,\s*status,\s*sort\]\)/);
    expect(schema).toMatch(
      /model SystemConfig[\s\S]*@@index\(\[configGroup,\s*configKey\]\)/
    );
  });
});
