import { Component, DoCheck, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-header-logo',
  templateUrl: './header-logo.component.html',
  styleUrls: ['./header-logo.component.scss'],
})
export class HeaderLogoComponent implements OnInit, DoCheck {
  user: any = null;
  private lastUserSnapshot = '';

  ngOnInit(): void {
    this.syncUserFromStorage();
  }

  ngDoCheck(): void {
    this.syncUserFromStorage();
  }

  private syncUserFromStorage(): void {
    const rawUser = localStorage.getItem('user') || '';

    if (rawUser === this.lastUserSnapshot) {
      return;
    }

    this.lastUserSnapshot = rawUser;
    this.user = this.safeParseUser(rawUser);
  }

  private safeParseUser(rawUser: string): any {
    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser);
    } catch {
      return null;
    }
  }

  private isDefaultLogoPath(value: string): boolean {
    return value.endsWith('/uploads/default-logo.png');
  }

  private isLikelyBase64(value: string): boolean {
    return value.length > 100 && /^[A-Za-z0-9+/=\r\n]+$/.test(value);
  }

  // Association logos are bundled with the frontend so they always render,
  // independent of the backend /uploads volume. Keyed by short code.
  private readonly associationLogoByCode: Record<string, string> = {
    KOBETA: 'assets/icon/associations/kobeta_logo.jpg',
    RATA: 'assets/icon/associations/rata_logo.jpg',
    KOMTDA: 'assets/icon/associations/komtda_logo.jpg',
    USTA: 'assets/icon/associations/usta_logo.jpg',
    NTA: 'assets/icon/associations/nta_logo.jpg',
    KATA: 'assets/icon/associations/kata_logo.jpg',
    KTA: 'assets/icon/associations/kta_logo.jpg',
  };

  get exploreSabahLogoSrc(): string {
    return localStorage.getItem('explore_sabah_logo') || 'assets/icon/explore_sabah-without_bg.png';
  }

  private resolveBundledAssociationLogo(): string {
    const assoc = this.user?.association;
    if (!assoc) {
      return '';
    }

    // Match the short code in parentheses, e.g. "... (KOBETA)" -> KOBETA.
    const name = String(assoc.name || '').toUpperCase();
    const match = name.match(/\(([A-Z]+)\)/);
    const code = match ? match[1] : '';

    if (code && this.associationLogoByCode[code]) {
      return this.associationLogoByCode[code];
    }

    // Fall back to scanning for any known code anywhere in the name.
    for (const knownCode of Object.keys(this.associationLogoByCode)) {
      if (name.includes(knownCode)) {
        return this.associationLogoByCode[knownCode];
      }
    }

    return '';
  }

  get companyLogoSrc(): string {
    // Prefer a bundled association logo (always available, no /uploads dependency).
    const bundledAssociationLogo = this.resolveBundledAssociationLogo();
    if (bundledAssociationLogo) {
      return bundledAssociationLogo;
    }

    const logo =
      this.user?.company_logo ||
      this.user?.company?.operator_logo_image ||
      this.user?.association?.image;

    if (!logo) {
      return '';
    }

    const normalizedLogo = String(logo).trim();

    if (!normalizedLogo || this.isDefaultLogoPath(normalizedLogo)) {
      return '';
    }

    if (
      normalizedLogo.startsWith('data:') ||
      normalizedLogo.startsWith('http://') ||
      normalizedLogo.startsWith('https://')
    ) {
      return this.isDefaultLogoPath(normalizedLogo) ? '' : normalizedLogo;
    }

    if (normalizedLogo.startsWith('/uploads/')) {
      return `${environment.API}${normalizedLogo}`;
    }

    if (normalizedLogo.startsWith('uploads/')) {
      return `${environment.API}/${normalizedLogo}`;
    }

    if (this.isLikelyBase64(normalizedLogo)) {
      return `data:image/png;base64,${normalizedLogo}`;
    }

    return normalizedLogo;
  }
}
