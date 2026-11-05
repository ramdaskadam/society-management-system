import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

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
}

