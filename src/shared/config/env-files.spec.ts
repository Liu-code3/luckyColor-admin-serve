import { resolveEnvFilePaths } from './env-files';

describe('resolveEnvFilePaths', () => {
  it('prefers dev overlay by default', () => {
    expect(resolveEnvFilePaths('')).toEqual(['.env.dev', '.env']);
  });

  it('loads prod overlay when NODE_ENV is production-like', () => {
    expect(resolveEnvFilePaths('production')).toEqual(['.env.prod', '.env']);
    expect(resolveEnvFilePaths('prod')).toEqual(['.env.prod', '.env']);
  });

  it('falls back to common env for unsupported environments', () => {
    expect(resolveEnvFilePaths('test')).toEqual(['.env']);
  });
});
