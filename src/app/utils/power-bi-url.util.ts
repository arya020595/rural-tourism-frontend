const POWER_BI_SENSITIVE_PARAMS = new Set([
  'access_token',
  'token',
  'id_token',
  'embedtoken',
  'jwt',
  'sig',
  'signature',
  'apikey',
  'api_key',
]);

export function sanitizePowerBiUrl(rawUrl: unknown): string | null {
  if (typeof rawUrl !== 'string') {
    return null;
  }

  const trimmedUrl = rawUrl.trim();
  if (!trimmedUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(trimmedUrl);
    const hostname = parsedUrl.hostname.toLowerCase();

    if (parsedUrl.protocol !== 'https:') {
      return null;
    }

    if (hostname !== 'powerbi.com' && !hostname.endsWith('.powerbi.com')) {
      return null;
    }

    let hasSensitiveParam = false;
    parsedUrl.searchParams.forEach((_value, queryKey) => {
      if (POWER_BI_SENSITIVE_PARAMS.has(queryKey.toLowerCase())) {
        hasSensitiveParam = true;
      }
    });

    if (hasSensitiveParam) {
      return null;
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
}
