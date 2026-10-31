import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplaintStats } from '../../../models/society.model';

@Component({
  selector: 'app-chart-complaints',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart-complaints.component.html',
  styleUrls: ['./chart-complaints.component.css']
})
export class ChartComplaintsComponent {
  @Input() set stats(s: ComplaintStats) {
    this._stats = s;
    this.calculateSegments();
  }
  get stats(): ComplaintStats {
    return this._stats;
  }

  @Output() viewAll = new EventEmitter<void>();

  private _stats: ComplaintStats = { open: 12, inProgress: 6, resolved: 5, closed: 1, total: 24 };
  segments: { count: number; color: string; label: string; strokeDash: string; offset: number; percent: number }[] = [];

  getPercent(count: number): number {
    return this.stats.total > 0 ? Math.round((count / this.stats.total) * 100) : 0;
  }

  private calculateSegments(): void {
    const total = this._stats.total || 24;
    const radius = 68;
    const circumference = 2 * Math.PI * radius;

    const items = [
      { count: this._stats.open, color: '#ef4444', label: 'Open' },
      { count: this._stats.inProgress, color: '#f59e0b', label: 'In Progress' },
      { count: this._stats.resolved, color: '#10b981', label: 'Resolved' },
      { count: this._stats.closed, color: '#3b82f6', label: 'Closed' }
    ];

    let accumulatedFraction = 0;
    this.segments = items.map(item => {
      const fraction = item.count / total;
      const strokeDash = `${fraction * circumference} ${circumference}`;
      const offset = -accumulatedFraction * circumference;
      const percent = Math.round(fraction * 100);
      accumulatedFraction += fraction;

      return {
        count: item.count,
        color: item.color,
        label: item.label,
        strokeDash,
        offset,
        percent
      };
    });
  }
}
