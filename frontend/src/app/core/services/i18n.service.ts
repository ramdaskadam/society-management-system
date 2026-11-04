import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastNotificationService } from './toast-notification.service';

import enDict from '../../../assets/i18n/en.json';
import hiDict from '../../../assets/i18n/hi.json';
import mrDict from '../../../assets/i18n/mr.json';

export type SupportedLocale = 'en' | 'hi' | 'mr';

export interface LocaleOption {
  code: SupportedLocale;
  label: string;
  nativeLabel: string;
}

const LANG_STORAGE_KEY = 'green_meadows_sms_lang_v1';

const FALLBACK_DICTIONARIES: Record<SupportedLocale, Record<string, any>> = {
  en: enDict,
  hi: hiDict,
  mr: mrDict
};

/**
 * Enterprise Reactive i18n (Internationalization) Service
 * - Supports English (`en`), Hindi (`hi`), and Marathi (`mr`)
 * - Fetches `/assets/i18n/<lang>.json` via `HttpClient` with instant bundled fallback
 * - Updates `<html lang="...">` for screen-reader & browser accessibility compliance
 */
@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private readonly http = inject(HttpClient, { optional: true });
  private readonly toast = inject(ToastNotificationService);

  readonly availableLocales: LocaleOption[] = [
    { code: 'en', label: 'English', nativeLabel: 'EN' },
    { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
    { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' }
  ];

  readonly currentLang = signal<SupportedLocale>('en');
  readonly dictionary = signal<Record<string, any>>(enDict);

  readonly activeLocaleMeta = computed(() => {
    return this.availableLocales.find(l => l.code === this.currentLang()) || this.availableLocales[0];
  });

  constructor() {
    const saved = this.getSavedLocale();
    this.setLanguage(saved, false);
  }

  setLanguage(lang: SupportedLocale, notify = true): void {
    this.currentLang.set(lang);
    this.dictionary.set(FALLBACK_DICTIONARIES[lang] || enDict);

    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', lang);
    }

    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // Ignore storage errors in restricted environments
    }

    // Also fetch from `/assets/i18n/${lang}.json` over HTTP so dynamic asset overrides take effect
    this.http?.get<Record<string, any>>(`/assets/i18n/${lang}.json`).subscribe({
      next: remoteDict => {
        if (remoteDict && this.currentLang() === lang) {
          this.dictionary.set(remoteDict);
        }
      },
      error: () => {
        // Bundled fallback dictionary is already active
      }
    });

    if (notify) {
      const meta = this.availableLocales.find(l => l.code === lang);
      this.toast.showToast(`Language switched to ${meta?.label} (${meta?.nativeLabel})`, 'info');
    }
  }

  /**
   * Resolves a dot-notated translation key (e.g. `'nav.dashboard'`) and interpolates `{{param}}` tokens.
   */
  translate(key: string, params?: Record<string, string | number>): string {
    const dict = this.dictionary();
    const segments = key.split('.');
    let current: any = dict;

    for (const seg of segments) {
      if (current && typeof current === 'object' && seg in current) {
        current = current[seg];
      } else {
        current = undefined;
        break;
      }
    }

    // Fallback to English if key is missing in target locale
    if (typeof current !== 'string') {
      let fallback: any = enDict;
      for (const seg of segments) {
        fallback = fallback?.[seg];
      }
      current = typeof fallback === 'string' ? fallback : key;
    }

    if (!params) {
      return current;
    }

    return current.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match: string, token: string) => {
      return params[token] !== undefined ? String(params[token]) : `{{${token}}}`;
    });
  }

  private getSavedLocale(): SupportedLocale {
    try {
      const raw = localStorage.getItem(LANG_STORAGE_KEY) as SupportedLocale | null;
      if (raw === 'en' || raw === 'hi' || raw === 'mr') {
        return raw;
      }
    } catch {
      // Ignore
    }
    return 'en';
  }
}

