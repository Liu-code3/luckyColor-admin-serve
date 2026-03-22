import {
  hashPassword,
  isPasswordHash,
  verifyPassword
} from './password.util';

describe('password.util', () => {
  it('hashes plain password into argon2id format and verifies successfully', async () => {
    const passwordHash = await hashPassword('123456');

    expect(isPasswordHash(passwordHash)).toBe(true);
    await expect(verifyPassword(passwordHash, '123456')).resolves.toBe(true);
    await expect(verifyPassword(passwordHash, '654321')).resolves.toBe(false);
  });
});
