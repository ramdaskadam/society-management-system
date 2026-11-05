import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User, UserRole } from '../../../models/society.model';
import { ThemeService } from '../../../core/services/theme.service';
import { GlobalSearchResultItem, SocietyStateService } from '../../../services/society-state.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css'],
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe]
})
export class TopbarComponent {
  readonly state = inject(SocietyStateService);
  readonly theme = inject(ThemeService);

  @Input() user: User = { name: '', role: '', email: '', avatar: '' };
  @Input() role: UserRole = 'admin';
  @Input() unreadNotificationsCount: number = 0;
  @Output() openNotifications = new EventEmitter<void>();
  @Output() search = new EventEmitter<string>();
  @Output() toggleMobileMenu = new EventEmitter<void>();

  readonly dropdownOpen = signal(false);

  onSearchChange(val: string): void {
    this.state.setGlobalSearch(val);
    this.dropdownOpen.set(val.trim().length > 0);
    this.search.emit(val);
  }

  onSearchFocus(): void {
    if (this.state.globalSearchQuery().trim().length > 0) {
      this.dropdownOpen.set(true);
    }
  }

  closeDropdown(): void {
    this.dropdownOpen.set(false);
  }

  clearSearch(): void {
    this.state.clearGlobalSearch();
    this.dropdownOpen.set(false);
    this.search.emit('');
  }

  selectResult(item: GlobalSearchResultItem): void {
    this.dropdownOpen.set(false);
    this.state.setView(item.targetView);
  }
}
