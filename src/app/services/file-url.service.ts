import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export type Base64MimeType = 'image/png' | 'image/jpeg' | 'application/pdf';

/**
 * Resolves a stored file/image value into a displayable URL. Backend values
 * for uploaded files can be in any of these shapes depending on when the row
 * was written (see rural-tourism-backend/scripts/migrate-company-files-to-disk.js):
 *   - a full http(s) or data: URL/URI                    -> returned as-is
 *   - a `/uploads/...` or `uploads/...` path              -> prefixed with environment.API
 *   - a legacy base64 blob with no prefix                 -> wrapped as a data: URI
 *   - a legacy bare filename (e.g. "photo.jpg")            -> prefixed with API + legacySubdir, if given
 */
@Injectable({ providedIn: 'root' })
export class FileUrlService {
  resolve(
    value: string | null | undefined,
    options: { base64MimeType?: Base64MimeType; legacySubdir?: string } = {},
  ): string {
    const normalized = String(value ?? '').trim();
    if (!normalized) return '';

    if (
      normalized.startsWith('data:') ||
      normalized.startsWith('http://') ||
      normalized.startsWith('https://') ||
      normalized.startsWith('blob:') ||
      normalized.startsWith('assets/')
    ) {
      return normalized;
    }

    if (normalized.startsWith('/uploads/')) {
      return `${environment.API}${normalized}`;
    }

    if (normalized.startsWith('uploads/')) {
      return `${environment.API}/${normalized}`;
    }

    if (this.isLikelyBase64(normalized)) {
      return `data:${options.base64MimeType ?? 'image/png'};base64,${normalized}`;
    }

    if (options.legacySubdir) {
      return `${environment.API}/uploads/${options.legacySubdir}/${normalized}`;
    }

    return normalized;
  }

  isLikelyBase64(value: string): boolean {
    return value.length > 100 && /^[A-Za-z0-9+/=\r\n]+$/.test(value);
  }
}
