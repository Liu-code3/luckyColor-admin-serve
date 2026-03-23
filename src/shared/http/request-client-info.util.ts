interface RequestLike {
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
}

export interface RequestClientInfo {
  ipAddress: string;
  browserVersion: string;
  terminalSystem: string;
}

export function extractRequestClientInfo(
  request: RequestLike | undefined
): RequestClientInfo {
  const userAgent = getHeaderValue(request, 'user-agent');
  const forwardedFor = getHeaderValue(request, 'x-forwarded-for');
  const realIp = getHeaderValue(request, 'x-real-ip');
  const ipAddress = normalizeIpAddress(
    forwardedFor?.split(',')[0]?.trim() ||
      realIp ||
      request?.ip ||
      request?.socket?.remoteAddress ||
      'unknown'
  );

  return {
    ipAddress,
    browserVersion: parseBrowserVersion(userAgent),
    terminalSystem: parseTerminalSystem(userAgent)
  };
}

function getHeaderValue(
  request: RequestLike | undefined,
  headerName: string
) {
  const value = request?.headers?.[headerName];

  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

function normalizeIpAddress(value: string) {
  if (!value) {
    return 'unknown';
  }

  return value.replace(/^::ffff:/, '');
}

function parseBrowserVersion(userAgent: string) {
  const rules: Array<[RegExp, string]> = [
    [/Edg\/([\d.]+)/, 'Edge'],
    [/OPR\/([\d.]+)/, 'Opera'],
    [/Chrome\/([\d.]+)/, 'Chrome'],
    [/Firefox\/([\d.]+)/, 'Firefox'],
    [/Version\/([\d.]+).*Safari/, 'Safari'],
    [/MSIE\s([\d.]+)/, 'Internet Explorer'],
    [/Trident\/.*rv:([\d.]+)/, 'Internet Explorer']
  ];

  for (const [pattern, label] of rules) {
    const match = userAgent.match(pattern);
    if (match) {
      return `${label} ${match[1]}`;
    }
  }

  return 'Unknown Browser';
}

function parseTerminalSystem(userAgent: string) {
  const rules: Array<[RegExp, string]> = [
    [/Windows NT/i, 'Windows'],
    [/(Macintosh|Mac OS X)/i, 'macOS'],
    [/Android/i, 'Android'],
    [/(iPhone|iPad|iPod)/i, 'iOS'],
    [/Linux/i, 'Linux']
  ];

  for (const [pattern, label] of rules) {
    if (pattern.test(userAgent)) {
      return label;
    }
  }

  return 'Unknown OS';
}
