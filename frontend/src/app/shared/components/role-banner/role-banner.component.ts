import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserRole } from '../../../models/society.model';
import { I18nService, SupportedLocale } from '../../../core/services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  templateUrl: './role-banner.component.html',
  styleUrls: ['./role-banner.component.css'],
  selector: 'app-role-banner',
  standalone: true,
  imports: [CommonModule, TranslatePipe]
})
export class RoleBannerComponent {
  readonly i18n = inject(I18nService);

  @Input() currentRole: UserRole = 'admin';
  @Input() isTenantSession = false;
  @Input() societyName: string = '';
  /** Display names come from the signed-in users in the state store (no hardcoded people). */
  @Input() adminLabel: string = '';
  @Input() memberLabel: string = '';
  @Output() roleChange = new EventEmitter<UserRole>();
  @Output() tenantPortalSelect = new EventEmitter<void>();
  @Output() resetDemo = new EventEmitter<void>();

  setLang(code: SupportedLocale): void {
    this.i18n.setLanguage(code);
  }
}
