import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Describes ONE column of the dynamic table.
 * A view only supplies an array of these + the rows; the table renders everything else,
 * so any list screen (units, members, invoices...) can reuse it and just point at a backend array.
 */
export interface DataColumn<T = any> {
  /** Property name on the row object (also used for sorting/searching). */
  key: string;
  /** Header text. */
  label: string;
  /** How the cell is rendered. Default: 'text'. */
  type?: 'text' | 'number' | 'currency' | 'badge';
  /** Allow click-to-sort on the header. Default: true. */
  sortable?: boolean;
  /** Render value in bold. */
  bold?: boolean;
  /** Text appended to value, e.g. ' sq.ft'. */
  suffix?: string;
  /** Text prepended to value, e.g. 'Wing '. */
  prefix?: string;
  /** For 'badge' type: returns the CSS badge class for the row (e.g. 'badge-paid'). */
  badgeClass?: (row: T) => string;
  /** For 'currency' type: returns a CSS colour for the row (e.g. red when dues > 0). */
  color?: (row: T) => string | null;
  /** Optional custom accessor when the displayed value is derived from the row. */
  value?: (row: T) => string | number | null | undefined;
}

type SortDir = 'asc' | 'desc';

/**
 * Reusable, backend-agnostic data table.
 * Flow: parent passes `columns` + `rows` (+ `loading`) -> table filters by search box,
 * sorts by clicked header, pages the result and emits `rowClick` when a row is chosen.
 * On phones (<= 600px) each row collapses into a labelled card (see styles.css `.stack-mobile`).
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css']
})
export class DataTableComponent<T extends object = any> {
  /** Column configuration. */
  readonly columns = input.required<DataColumn<T>[]>();
  /** Row data (usually a signal value coming from the state store / API). */
  readonly rows = input<T[]>([]);
  /** Shows skeleton rows while the backend call is in flight. */
  readonly loading = input<boolean>(false);
  /** Shows the search box. */
  readonly searchable = input<boolean>(true);
  /** Rows revealed per "Show more" click. */
  readonly pageSize = input<number>(15);
  /** Property used to uniquely identify a row (for efficient re-rendering). */
  readonly trackKey = input<string>('id');
  /** Text for the empty state. */
  readonly emptyMessage = input<string>('No records found');
  /** Emitted when a row is clicked. */
  readonly rowClick = output<T>();

  readonly query = signal('');
  readonly sortKey = signal<string | null>(null);
  readonly sortDir = signal<SortDir>('asc');
  readonly visibleCount = signal<number>(0);

  /** Step 1: filter rows by the search text across all column values. */
  private readonly filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    const all = this.rows() ?? [];
    if (!q) return all;
    const cols = this.columns();
    return all.filter(row => cols.some(c => String(this.cellValue(row, c) ?? '').toLowerCase().includes(q)));
  });

  /** Step 2: sort the filtered rows (numbers numerically, text with locale compare). */
  readonly sorted = computed(() => {
    const key = this.sortKey();
    const list = this.filtered();
    if (!key) return list;
    const col = this.columns().find(c => c.key === key);
    if (!col) return list;
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const av = this.cellValue(a, col);
      const bv = this.cellValue(b, col);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true }) * dir;
    });
  });

  /** Step 3: page the sorted rows. */
  readonly visibleRows = computed(() => {
    const limit = Math.max(this.visibleCount(), this.pageSize());
    return this.sorted().slice(0, limit);
  });

  readonly skeletonRows = [1, 2, 3, 4, 5];

  /** Reads a cell value using the custom accessor or the column key. */
  cellValue(row: T, col: DataColumn<T>): any {
    return col.value ? col.value(row) : (row as any)[col.key];
  }

  /** Formats a cell for display depending on the column type. */
  display(row: T, col: DataColumn<T>): string {
    const v = this.cellValue(row, col);
    if (v === null || v === undefined || v === '') return '—';
    const text = col.type === 'currency' || col.type === 'number' ? Number(v).toLocaleString('en-IN') : String(v);
    return `${col.type === 'currency' ? '₹ ' : ''}${col.prefix ?? ''}${text}${col.suffix ?? ''}`;
  }

  onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.visibleCount.set(0); // restart paging for a new search
  }

  toggleSort(col: DataColumn<T>): void {
    if (col.sortable === false) return;
    if (this.sortKey() === col.key) {
      this.sortDir.update(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(col.key);
      this.sortDir.set('asc');
    }
  }

  showMore(): void {
    this.visibleCount.set(Math.max(this.visibleCount(), this.pageSize()) + this.pageSize());
  }

  rowId(index: number, row: T): unknown {
    return (row as any)[this.trackKey()] ?? index;
  }

  ariaSort(col: DataColumn<T>): 'ascending' | 'descending' | 'none' {
    if (this.sortKey() !== col.key) return 'none';
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }
}

