import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { evaluatePassword } from '../../../core/utils/password-policy';

/** Live checklist of password rules (green tick when met). Reused by Register and Forgot-password. */
@Component({
  selector: 'app-password-checklist',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="pw-rules" aria-live="polite" aria-label="Password requirements">
      @for (r of rules(); track r.id) {
        <li [class.ok]="r.passed"><span aria-hidden="true">{{ r.passed ? '✓' : '○' }}</span> {{ r.label }}</li>
      }
    </ul>
  `,
  styles: [`
    .pw-rules { list-style: none; margin: 0 0 12px; padding: 0; display: grid; gap: 3px; font-size: 0.75rem; color: var(--text-muted); }
    .pw-rules li.ok { color: #059669; }
  `]
})
export class PasswordChecklistComponent {
  readonly password = input<string>('');
  /** Name / email / mobile values the password must not contain. */
  readonly personal = input<string[]>([]);
  readonly rules = computed(() => evaluatePassword(this.password(), this.personal()));
}
