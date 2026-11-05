import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User, UserRole } from '../../../models/society.model';
import { I18nService, SupportedLocale } from '../../../core/services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css'],
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe]
})
export class TopbarComponent {
  readonly i18n = inject(I18nService);

  @Input() user: User = { name: '', role: '', email: '', avatar: '' };
  @Input() role: UserRole = 'admin';
  @Input() unreadNotificationsCount: number = 0;
  @Output() openNotifications = new EventEmitter<void>();
  @Output() search = new EventEmitter<string>();
  @Output() toggleMobileMenu = new EventEmitter<void>();

  query = '';

  onSearchChange(val: string): void {
    this.search.emit(val);
  }

  onLangChange(code: SupportedLocale): void {
    this.i18n.setLanguage(code);
  }
}
