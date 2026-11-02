import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { IonContent, NavController, ToastController } from '@ionic/angular';
import { GUIDE_SECTIONS, GuideSection, GuideText } from './user-guide.content';
import { USER_GUIDE_UPDATED, VIDEO_TUTORIAL_URL } from './user-guide.config';

type Lang = 'bm' | 'en';

const LANG_KEY = 'rutec_guide_lang';

/**
 * Panduan Pengguna / User Guide for operators. Public page (no login), opened
 * from the login page. Content is in user-guide.content.ts; one language is
 * shown at a time (BM ↔ EN toggle, remembered per device).
 */
@Component({
  selector: 'app-user-guide',
  templateUrl: './user-guide.page.html',
  styleUrls: ['./user-guide.page.scss'],
})
export class UserGuidePage implements AfterViewInit, OnDestroy {
  @ViewChild(IonContent) content?: IonContent;
  @ViewChild('sectionsHost') sectionsHost?: ElementRef<HTMLElement>;

  readonly sections = GUIDE_SECTIONS;
  readonly updated = USER_GUIDE_UPDATED;
  readonly hasVideo = !!VIDEO_TUTORIAL_URL;

  lang: Lang = this.readLang();
  search = '';
  activeId = GUIDE_SECTIONS[0]?.id || '';
  tocOpen = false;
  zoomSrc: string | null = null;
  zoomCaption = '';

  private observer?: IntersectionObserver;

  constructor(
    private navCtrl: NavController,
    private toastController: ToastController,
  ) {}

  ngAfterViewInit(): void {
    void this.watchSections();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  /* ── Language ─────────────────────────────────────────────────────── */

  t(text: GuideText): string {
    return text[this.lang];
  }

  setLang(lang: Lang): void {
    this.lang = lang;
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      // Private mode / storage blocked: the toggle still works for this visit.
    }
  }

  private readLang(): Lang {
    try {
      return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'bm';
    } catch {
      return 'bm';
    }
  }

  /** Escapes the text, then turns **x** into <b>x</b> (the only markup). */
  rich(text: GuideText): string {
    const escaped = this.t(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return escaped.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  }

  /* ── Search & contents ────────────────────────────────────────────── */

  get visibleSections(): GuideSection[] {
    const term = this.search.trim().toLowerCase();
    if (!term) return this.sections;
    return this.sections.filter((section) => this.sectionText(section).includes(term));
  }

  /** Sidebar groups, in content order. */
  get groups(): Array<{ label: string; sections: GuideSection[] }> {
    const groups: Array<{ label: string; sections: GuideSection[] }> = [];
    for (const section of this.visibleSections) {
      const label = this.t(section.group);
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.sections.push(section);
      else groups.push({ label, sections: [section] });
    }
    return groups;
  }

  onSearch(value: string): void {
    this.search = value;
    // The list of sections changes: re-observe after Angular renders it.
    setTimeout(() => void this.watchSections());
  }

  clearSearch(): void {
    this.onSearch('');
  }

  private sectionText(section: GuideSection): string {
    const parts: string[] = [this.t(section.title), this.t(section.group)];
    for (const block of section.blocks) {
      switch (block.kind) {
        case 'p':
        case 'tip':
        case 'note':
        case 'warn':
          parts.push(this.t(block.text));
          break;
        case 'steps':
        case 'list':
          block.items.forEach((item) => parts.push(this.t(item)));
          break;
        case 'img':
          parts.push(this.t(block.caption));
          break;
        case 'table':
          block.head.forEach((cell) => parts.push(this.t(cell)));
          block.rows.forEach((row) => row.forEach((cell) => parts.push(this.t(cell))));
          break;
      }
    }
    return parts.join(' ').replace(/\*\*/g, '').toLowerCase();
  }

  async goTo(id: string): Promise<void> {
    this.tocOpen = false;
    this.activeId = id;
    const target = document.getElementById('guide-' + id);
    const scrollEl = await this.content?.getScrollElement();
    if (!target || !scrollEl) return;
    const top =
      target.getBoundingClientRect().top - scrollEl.getBoundingClientRect().top + scrollEl.scrollTop - 12;
    await this.content?.scrollToPoint(0, Math.max(top, 0), 400);
  }

  async toTop(): Promise<void> {
    await this.content?.scrollToTop(400);
  }

  /** Highlights the section being read in the contents list. */
  private async watchSections(): Promise<void> {
    this.observer?.disconnect();
    const root = await this.content?.getScrollElement();
    const host = this.sectionsHost?.nativeElement;
    if (!root || !host || typeof IntersectionObserver === 'undefined') return;
    this.observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) this.activeId = visible[0].target.id.replace(/^guide-/, '');
      },
      { root, rootMargin: '0px 0px -65% 0px', threshold: 0 },
    );
    host.querySelectorAll('section.guide-section').forEach((el) => this.observer!.observe(el));
  }

  /* ── Images ───────────────────────────────────────────────────────── */

  zoom(src: string, caption: GuideText): void {
    this.zoomSrc = src;
    this.zoomCaption = this.t(caption);
  }

  closeZoom(): void {
    this.zoomSrc = null;
  }

  /* ── Actions ──────────────────────────────────────────────────────── */

  backToLogin(): void {
    (document.activeElement as HTMLElement | null)?.blur();
    this.navCtrl.navigateBack('/login');
  }

  async openVideo(): Promise<void> {
    if (VIDEO_TUTORIAL_URL) {
      window.open(VIDEO_TUTORIAL_URL, '_blank');
      return;
    }
    const toast = await this.toastController.create({
      message: this.lang === 'bm' ? 'Video tutorial akan datang.' : 'The video tutorial is coming soon.',
      duration: 2000,
      position: 'bottom',
      color: 'medium',
    });
    await toast.present();
  }

  trackSection(_index: number, section: GuideSection): string {
    return section.id;
  }
}
