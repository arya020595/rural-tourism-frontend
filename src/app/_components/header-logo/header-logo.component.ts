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

  get companyLogoSrc(): string {
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
