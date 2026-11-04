import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';

/**
 * Standalone Reactive Translation Pipe (`| t`)
 * Usage:
 *   `{{ 'nav.dashboard' | t }}`
 *   `{{ 'memberDash.welcome' | t:{ name: user.name } }}`
 */
@Pipe({
  name: 't',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: string, params?: Record<string, string | number>): string {
    return this.i18n.translate(key, params);
  }
}

