import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-header-logo',
  templateUrl: './header-logo.component.html',
  styleUrls: ['./header-logo.component.scss'],
})
export class HeaderLogoComponent implements OnInit {
  user: any = null;

  ngOnInit() {
    const storedUser = localStorage.getItem('user');
    this.user = storedUser ? JSON.parse(storedUser) : null;
  }

  get companyLogoSrc(): string {
    const logo = this.user?.company_logo || this.user?.association?.image;

    if (!logo) {
      return '';
    }

    return logo.startsWith('data:') || logo.startsWith('http')
      ? logo
      : 'data:image/png;base64,' + logo;
  }
}
