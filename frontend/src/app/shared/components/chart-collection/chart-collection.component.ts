import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CollectionMonth } from '../../../models/society.model';

@Component({
  selector: 'app-chart-collection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart-collection.component.html',
  styleUrls: ['./chart-collection.component.css']
})
export class ChartCollectionComponent {
  @Input() set data(months: CollectionMonth[]) {
    this.calculateChart(months);
  }

  readonly yGuidelines = [
    { val: 1000000, label: '10L', yPos: 15 },
    { val: 800000, label: '8L', yPos: 50 },
    { val: 600000, label: '6L', yPos: 85 },
    { val: 400000, label: '4L', yPos: 120 },
    { val: 200000, label: '2L', yPos: 155 },
    { val: 0, label: '0', yPos: 190 }
  ];

  bars: { x: number; y: number; width: number; height: number; pending: number; month: string }[] = [];
  points: { x: number; y: number; val: number; month: string }[] = [];
  linePath: string = '';

  private calculateChart(data: CollectionMonth[]): void {
    if (!data || data.length === 0) return;
    const maxVal = 1000000;
    const padLeft = 40;
    const padTop = 15;
    const padRight = 20;
    const height = 175;
    const width = 600 - padLeft - padRight;
    const xStep = width / (data.length - 1);
    const barWidth = 16;

    this.bars = data.map((d, i) => {
      const x = padLeft + i * xStep - barWidth / 2;
      const barHeight = (d.pending / maxVal) * height;
      const y = padTop + height - barHeight;
      return { x, y, width: barWidth, height: barHeight, pending: d.pending, month: d.month };
    });

    this.points = data.map((d, i) => {
      const x = padLeft + i * xStep;
      const y = padTop + height - (d.collected / maxVal) * height;
      return { x, y, val: d.collected, month: d.month };
    });

    this.linePath = this.points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');
  }
}
