import { computed, Injectable, signal } from '@angular/core';

export type ColorSchemePreference = 'light dark' | 'light' | 'dark';
export type ResolvedColorScheme = 'light' | 'dark';

const STORAGE_KEY = 'color-scheme';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  /** Stored user override ('light' | 'dark') or 'light dark' when following system */
  readonly preference = signal<ColorSchemePreference>(this.readInitialPreference());

  /** Live OS color scheme from matchMedia('(prefers-color-scheme: dark)') */
  readonly systemScheme = signal<ResolvedColorScheme>(this.readSystemScheme());

  /** Currently rendered color scheme ('light' | 'dark') */
  readonly resolvedScheme = computed<ResolvedColorScheme>(() => {
    const pref = this.preference();
    if (pref === 'light' || pref === 'dark') {
      return pref;
    }
    return this.systemScheme();
  });

  constructor() {
    this.syncMetaTag(this.preference());

    if (typeof window !== 'undefined') {
      // Listen for OS color-scheme changes (never retroactively delete stored preference)
      if (typeof window.matchMedia === 'function') {
        const mql = window.matchMedia('(prefers-color-scheme: dark)');
        mql.addEventListener('change', e => {
          this.systemScheme.set(e.matches ? 'dark' : 'light');
        });
      }

      // Stay in sync across tabs via storage event
      window.addEventListener('storage', e => {
        if (e.key === STORAGE_KEY) {
          const next: ColorSchemePreference =
            e.newValue === 'light' || e.newValue === 'dark' ? e.newValue : 'light dark';
          this.preference.set(next);
          this.syncMetaTag(next);
        }
      });
    }
  }

  /**
   * Two-state header toggle following `dark-mode-toggle` guidance:
   * - Flips to the opposite of the currently rendered scheme.
   * - If target differs from current system preference, stores it literally ('light' | 'dark').
   * - If target matches current system preference, removes stored value so page follows system ('light dark').
   */
  toggle(): void {
    const currentRendered = this.resolvedScheme();
    const target: ResolvedColorScheme = currentRendered === 'dark' ? 'light' : 'dark';
    const currentSystem = this.systemScheme();

    if (target !== currentSystem) {
      this.setPreference(target);
    } else {
      this.setPreference('light dark');
    }
  }

  /**
   * Explicit three-state setter for Settings ('light dark' | 'light' | 'dark').
   */
  setPreference(next: ColorSchemePreference): void {
    this.preference.set(next);
    try {
      if (next === 'light dark') {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, next);
      }
    } catch {
      // Ignore storage errors if blocked; still apply to current page
    }
    this.syncMetaTag(next);
  }

  private readInitialPreference(): ColorSchemePreference {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch {
      // Ignore storage access errors
    }
    return 'light dark';
  }

  private readSystemScheme(): ResolvedColorScheme {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }

  private syncMetaTag(pref: ColorSchemePreference): void {
    if (typeof document === 'undefined') return;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'color-scheme';
      document.head.prepend(meta);
    }
    meta.content = pref;
    document.documentElement.setAttribute('data-color-scheme', pref);
  }
}
