import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Reusable Confirmation Dialog Component (`<app-confirm-dialog>`).
 * Displays an accessible modal confirmation prompt before destructive or important actions
 * (such as removing a family member, deleting a tenant, ending a lease, or resetting data).
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styles: [`
    .confirm-dialog-card { max-width: 440px; }
    .confirm-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      flex: none;
    }
    .confirm-icon-danger {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }
    .confirm-icon-primary {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }
    .btn-danger-solid {
      background: #dc2626;
      color: #ffffff;
      border: 1px solid #b91c1c;
      padding: 9px 16px;
      border-radius: var(--radius-md, 10px);
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
    }
    .btn-danger-solid:hover { background: #b91c1c; }
  `]
})
export class ConfirmDialogComponent {
  readonly isOpen = input(false);
  readonly title = input('Confirm Action');
  readonly message = input('Are you sure you want to proceed?');
  readonly confirmText = input('Confirm');
  readonly cancelText = input('Cancel');
  readonly variant = input<'danger' | 'primary'>('danger');

  readonly confirm = output<void>();
  readonly cancel = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.cancel.emit();
    }
  }
}
