import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocietyStateService } from '../../../services/society-state.service';
import { SocietyPoll } from '../../../models/society.model';

@Component({
  selector: 'app-polls-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './polls-view.component.html',
  styleUrls: ['./polls-view.component.css']
})
export class PollsViewComponent {
  readonly state = inject(SocietyStateService);

  showCreateForm = false;
  title = '';
  description = '';
  category: SocietyPoll['category'] = 'Capital Expenditure';
  endDate = '30 Jun 2024';
  option1 = '';
  option2 = '';
  option3 = '';

  get activePollsCount(): number {
    return this.state.polls().filter(p => p.status === 'Active').length;
  }

  getPercentage(votes: number, total: number): number {
    if (!total) return 0;
    return Math.round((votes / total) * 100);
  }

  vote(pollId: string, optionId: string): void {
    this.state.castPollVote(pollId, optionId);
  }

  closePoll(pollId: string): void {
    this.state.closePoll(pollId);
  }

  onCreatePoll(): void {
    if (!this.title.trim() || !this.option1.trim() || !this.option2.trim()) return;
    const options = [this.option1.trim(), this.option2.trim()];
    if (this.option3.trim()) options.push(this.option3.trim());

    this.state.createPoll({
      title: this.title.trim(),
      description: this.description.trim(),
      category: this.category,
      endDate: this.endDate.trim() || '30 Jun 2024',
      options
    });

    this.title = '';
    this.description = '';
    this.option1 = '';
    this.option2 = '';
    this.option3 = '';
    this.showCreateForm = false;
  }
}
