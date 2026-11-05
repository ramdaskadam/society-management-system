import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  fullName = '';
  email = '';
  username = '';
  password = '';
  confirmPassword = '';
  readonly error = signal('');

  submit(): void {
    if (this.password !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }
    const result = this.auth.register({
      fullName: this.fullName,
      email: this.email,
      username: this.username,
      password: this.password
    });
    if (!result.ok) {
      this.error.set(result.error ?? 'Registration failed.');
      return;
    }
    this.error.set('');
    this.router.navigateByUrl('/dashboard');
  }
}

