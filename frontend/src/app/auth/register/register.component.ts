import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PasswordChecklistComponent } from '../../shared/components/password-checklist/password-checklist.component';
import { AuthService, HINT_QUESTIONS } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, PasswordChecklistComponent],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  firstName = '';
  lastName = '';
  mobile = '';
  email = '';
  /** Which identifier the user will sign in with (becomes the username). */
  loginWith: 'email' | 'mobile' = 'email';
  password = '';
  confirmPassword = '';
  /** Options for the hint-question dropdown (used later by Forgot password). */
  readonly hintQuestions = HINT_QUESTIONS;
  hintQuestion = '';
  hintAnswer = '';
  readonly error = signal('');

  /** Values the password must not contain (fed to the live checklist). */
  get personalInfo(): string[] {
    return [this.firstName, this.lastName, this.email.split('@')[0], this.mobile.replace(/\D/g, '')];
  }

  submit(): void {
    if (this.password !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }
    const result = this.auth.register({
      firstName: this.firstName,
      lastName: this.lastName,
      mobile: this.mobile,
      email: this.email,
      loginWith: this.loginWith,
      password: this.password,
      hintQuestion: this.hintQuestion,
      hintAnswer: this.hintAnswer
    });
    if (!result.ok) {
      this.error.set(result.error ?? 'Registration failed.');
      return;
    }
    this.error.set('');
    this.router.navigateByUrl('/dashboard');
  }
}

