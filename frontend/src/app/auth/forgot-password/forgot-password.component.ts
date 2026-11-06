import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PasswordChecklistComponent } from '../../shared/components/password-checklist/password-checklist.component';
import { AuthService } from '../../core/services/auth.service';
import { SocietyStateService } from '../../services/society-state.service';

/**
 * Forgot-password flow (2 steps):
 *  1. "identify": user enters username/email -> we show the hint question chosen at registration.
 *  2. "reset":    user answers the hint and sets a new password -> back to /login.
 * Backend later: replace the two AuthService calls with POST /auth/forgot + /auth/reset.
 */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, PasswordChecklistComponent],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly state = inject(SocietyStateService);

  readonly step = signal<'identify' | 'reset'>('identify');
  readonly question = signal('');
  readonly error = signal('');

  identifier = '';
  answer = '';
  newPassword = '';
  confirmPassword = '';

  findAccount(): void {
    const result = this.auth.getHintQuestion(this.identifier);
    if (!result.ok) {
      this.error.set(result.error ?? 'Account not found.');
      return;
    }
    this.error.set('');
    this.question.set(result.question ?? '');
    this.step.set('reset');
  }

  resetPassword(): void {
    if (this.newPassword !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }
    const result = this.auth.resetPassword(this.identifier, this.answer, this.newPassword);
    if (!result.ok) {
      this.error.set(result.error ?? 'Could not reset password.');
      return;
    }
    this.state.showToast('Password updated. Please sign in with your new password.', 'success');
    this.router.navigateByUrl('/login');
  }

  back(): void {
    this.step.set('identify');
    this.error.set('');
    this.answer = '';
  }
}
