import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastMessage } from '../../../models/society.model';

@Component({
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.css'],
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule]
})
export class ToastContainerComponent {
  @Input() toasts: ToastMessage[] = [];
}
