import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Activity } from '../../../models/society.model';

@Component({
  selector: 'app-recent-activities',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recent-activities.component.html',
  styleUrls: ['./recent-activities.component.css']
})
export class RecentActivitiesComponent {
  @Input() activities: Activity[] = [];
  @Output() viewAll = new EventEmitter<void>();

  getBg(type: Activity['type']): string {
    switch (type) {
      case 'payment': return '#ecfdf5';
      case 'complaint': return '#fef2f2';
      case 'notice': return '#fffbeb';
      case 'amenity': return '#eff6ff';
      default: return '#f1f5f9';
    }
  }

  getColor(type: Activity['type']): string {
    switch (type) {
      case 'payment': return '#059669';
      case 'complaint': return '#dc2626';
      case 'notice': return '#d97706';
      case 'amenity': return '#2563eb';
      default: return '#475569';
    }
  }
}
