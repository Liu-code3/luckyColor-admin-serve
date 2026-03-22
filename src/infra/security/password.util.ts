import * as argon2 from 'argon2';

const PASSWORD_HASH_PREFIX = '$argon2';

function buildArgon2Options() {
  const pepper = process.env.PASSWORD_PEPPER?.trim();

  return {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
    ...(pepper
      ? {
          secret: Buffer.from(pepper, 'utf8')
        }
      : {})
  } satisfies argon2.Options & { type: typeof argon2.argon2id };
}

export function isPasswordHash(value: string) {
  return value.startsWith(PASSWORD_HASH_PREFIX);
}

export async function hashPassword(plainPassword: string) {
  return argon2.hash(plainPassword, buildArgon2Options());
}

export async function verifyPassword(
  passwordHash: string,
  plainPassword: string
) {
  return argon2.verify(passwordHash, plainPassword, buildArgon2Options());
}
