import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService, SocialProvider } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  username = '';
  password = '';
  readonly error = signal('');
  readonly showPassword = signal(false);
  /** Provider whose (simulated) consent step is open; null = closed. */
  readonly socialProvider = signal<SocialProvider | null>(null);
  socialEmail = '';

  /** Password sign-in: validates, calls AuthService, then routes to the dashboard. */
  submit(): void {
    const result = this.auth.login(this.username, this.password);
    if (!result.ok) {
      this.error.set(result.error ?? 'Sign-in failed.');
      return;
    }
    this.error.set('');
    this.router.navigateByUrl('/dashboard');
  }

  useDemo(): void {
    this.username = 'demo';
    this.password = 'demo';
    this.error.set('');
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  /** Step 1 of social login: choose Google/Facebook (opens the email step in mock mode). */
  startSocial(provider: SocialProvider): void {
    this.error.set('');
    this.socialEmail = '';
    // Live mode redirects straight to the provider, so no email step is needed.
    if (!environment.useMockApi) {
      this.auth.loginWithProvider(provider, '');
      return;
    }
    this.socialProvider.set(provider);
  }

  /** Step 2 (mock): confirm the email and sign in. */
  confirmSocial(): void {
    const provider = this.socialProvider();
    if (!provider) return;
    const result = this.auth.loginWithProvider(provider, this.socialEmail);
    if (!result.ok) {
      this.error.set(result.error ?? 'Sign-in failed.');
      return;
    }
    this.error.set('');
    this.router.navigateByUrl('/dashboard');
  }

  cancelSocial(): void {
    this.socialProvider.set(null);
    this.error.set('');
  }
}
