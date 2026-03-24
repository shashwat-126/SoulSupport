function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function stripTrailingSlash(value) {
  return value.replace(/\/$/, '');
}

function assertNoLocalhostInProduction(url, keyName) {
  if (isProduction() && /localhost|127\.0\.0\.1/i.test(url)) {
    throw new Error(`${keyName} cannot point to localhost in production`);
  }
}

export function getPublicApiBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const normalized = stripTrailingSlash(raw);

  if (!process.env.NEXT_PUBLIC_API_URL && isProduction()) {
    throw new Error('Missing NEXT_PUBLIC_API_URL in production');
  }

  assertNoLocalhostInProduction(normalized, 'NEXT_PUBLIC_API_URL');
  return normalized;
}

export function getServerApiBaseUrl() {
  const raw = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!raw) {
    return null;
  }

  const normalized = stripTrailingSlash(raw);
  assertNoLocalhostInProduction(normalized, 'API_URL/NEXT_PUBLIC_API_URL');
  return normalized;
}
