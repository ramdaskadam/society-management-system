import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.component.html',
  styleUrls: ['./stat-card.component.css']
})
export class StatCardComponent {
  @Input() label: string = '';
  @Input() value: string = '';
  @Input() trend: string = '';
  @Input() trendType: 'positive' | 'negative' | 'neutral' = 'neutral';
  @Input() theme: 'blue' | 'green' | 'purple' | 'orange' | 'red' = 'blue';
  @Input() icon: string = 'users';
}
