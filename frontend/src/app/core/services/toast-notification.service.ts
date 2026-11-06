import { Injectable, Injector, inject, signal } from '@angular/core';
import { I18nService } from './i18n.service';
import { ToastMessage } from '../../models/society.model';

/**
 * Ephemeral UI Toast Notification Service
 * Separated from domain state so UI toast timers never trigger `localStorage` persistence.
 */
@Injectable({
  providedIn: 'root'
})
export class ToastNotificationService {
  readonly toasts = signal<ToastMessage[]>([]);

  private readonly injector = inject(Injector);

  /**
   * Shows a toast. `message` is either a dictionary key (e.g. 'msg.unitAdded', translated into the
   * active language with `params`) or plain text. Messages live in assets/i18n/*.json.
   */
  showToast(messageOrKey: string, type: ToastMessage['type'] = 'info', params?: Record<string, string | number>): void {
    const message = messageOrKey.startsWith('msg.')
      ? this.injector.get(I18nService).translate(messageOrKey, params)
      : messageOrKey;
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = { id, message, type };
    this.toasts.update(list => [...list, newToast]);

    setTimeout(() => {
      this.removeToast(id);
    }, 3500);
  }

  removeToast(id: string): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}

