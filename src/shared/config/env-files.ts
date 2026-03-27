import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DEV_ENV_ALIASES = new Set(['development', 'dev']);
const PROD_ENV_ALIASES = new Set(['production', 'prod']);

export function resolveEnvFilePaths(nodeEnv = process.env.NODE_ENV) {
  const normalizedNodeEnv = nodeEnv?.trim().toLowerCase();

  if (normalizedNodeEnv && PROD_ENV_ALIASES.has(normalizedNodeEnv)) {
    return ['.env.prod', '.env'];
  }

  if (!normalizedNodeEnv || DEV_ENV_ALIASES.has(normalizedNodeEnv)) {
    return ['.env.dev', '.env'];
  }

  return ['.env'];
}

export function loadEnvFilesIntoProcess(cwd = process.cwd()) {
  const envFilePaths = resolveEnvFilePaths().map((filePath) =>
    resolve(cwd, filePath)
  );
  let config: Record<string, string> = {};

  for (const envFilePath of envFilePaths) {
    if (!existsSync(envFilePath)) {
      continue;
    }

    config = {
      ...parseEnvFile(readFileSync(envFilePath, 'utf8')),
      ...config
    };
  }

  Object.entries(config).forEach(([key, value]) => {
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  });

  return config;
}

function parseEnvFile(content: string) {
  return content.split(/\r?\n/).reduce<Record<string, string>>((result, line) => {
    const normalizedLine = line.trim();

    if (!normalizedLine || normalizedLine.startsWith('#')) {
      return result;
    }

    const separatorIndex = normalizedLine.indexOf('=');
    if (separatorIndex < 1) {
      return result;
    }

    const key = normalizedLine.slice(0, separatorIndex).trim();
    const rawValue = normalizedLine.slice(separatorIndex + 1).trim();
    result[key] = unquoteEnvValue(rawValue);

    return result;
  }, {});
}

function unquoteEnvValue(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
