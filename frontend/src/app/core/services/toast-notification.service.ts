import { Injectable, signal } from '@angular/core';
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

  showToast(message: string, type: ToastMessage['type'] = 'info'): void {
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

