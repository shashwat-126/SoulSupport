function getBearerToken(request) {
  const header = request.headers.get('authorization') || '';
  if (!header.startsWith('Bearer ')) {
    return null;
  }
  return header.slice(7).trim();
}

function getApiBaseUrl() {
  const raw = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!raw) {
    return null;
  }

  return raw.replace(/\/$/, '');
}

export async function requireUserFromRequest(request) {
  const token = getBearerToken(request);
  if (!token) {
    return { error: 'Missing authorization token', status: 401 };
  }

  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    return { error: 'Server misconfiguration: missing API_URL or NEXT_PUBLIC_API_URL', status: 500 };
  }

  let response;
  try {
    response = await fetch(`${apiBaseUrl}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
  } catch {
    return { error: 'Unable to verify user session with backend', status: 502 };
  }

  if (!response.ok) {
    if (response.status === 401) {
      return { error: 'Invalid or expired token', status: 401 };
    }
    if (response.status === 403) {
      return { error: 'Not authorized', status: 403 };
    }
    return { error: 'Failed to validate authenticated user', status: 502 };
  }

  const payload = await response.json().catch(() => ({}));
  const user = payload?.data?.user || payload?.user;
  if (!user || !user.isActive) {
    return { error: 'User not found or inactive', status: 401 };
  }

  return { user };
}
