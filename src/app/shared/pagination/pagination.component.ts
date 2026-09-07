import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pagination-bar" *ngIf="totalItems > 0">
      <div class="pagination-info">
        Showing <strong>{{ startIndex }}</strong> – <strong>{{ endIndex }}</strong> of <strong>{{ totalItems }}</strong> entries
      </div>

      <div class="pagination-right">
        <div class="size-selector">
          <label for="pageSizeSelect">Per page:</label>
          <select id="pageSizeSelect" [ngModel]="pageSize" (ngModelChange)="onPageSizeSelect($event)">
            <option *ngFor="let opt of pageSizeOptions" [value]="opt">{{ opt }}</option>
          </select>
        </div>

        <div class="page-nav">
          <button type="button" class="nav-btn" [disabled]="currentPage <= 1" (click)="goToPage(1)" title="First Page">«</button>
          <button type="button" class="nav-btn" [disabled]="currentPage <= 1" (click)="goToPage(currentPage - 1)" title="Previous">‹</button>

          <button
            type="button"
            *ngFor="let page of getDisplayedPages()"
            class="nav-btn page-num"
            [class.active]="page === currentPage"
            (click)="goToPage(page)">
            {{ page }}
          </button>

          <button type="button" class="nav-btn" [disabled]="currentPage >= totalPages" (click)="goToPage(currentPage + 1)" title="Next">›</button>
          <button type="button" class="nav-btn" [disabled]="currentPage >= totalPages" (click)="goToPage(totalPages)" title="Last Page">»</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      margin-top: 1rem;
    }
    .pagination-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      padding: 0.85rem 1.2rem;
      background: rgba(22, 11, 40, 0.7);
      border: 1px solid rgba(168, 85, 247, 0.2);
      border-radius: 12px;
      backdrop-filter: blur(12px);
    }
    .pagination-info {
      font-size: 0.85rem;
      color: #94a3b8;
    }
    .pagination-info strong {
      color: #f8fafc;
      font-weight: 600;
    }
    .pagination-right {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      flex-wrap: wrap;
    }
    .size-selector {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.82rem;
      color: #cbd5e1;
    }
    .size-selector select {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(168, 85, 247, 0.3);
      border-radius: 6px;
      color: #f8fafc;
      padding: 0.3rem 0.6rem;
      font-size: 0.82rem;
      outline: none;
      cursor: pointer;
    }
    .size-selector select:focus {
      border-color: #a855f7;
    }
    .page-nav {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .nav-btn {
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #e2e8f0;
      min-width: 32px;
      height: 32px;
      padding: 0 0.5rem;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    .nav-btn:hover:not(:disabled) {
      background: rgba(168, 85, 247, 0.3);
      border-color: #a855f7;
      color: #ffffff;
    }
    .nav-btn.active {
      background: linear-gradient(135deg, #891EA2, #a855f7);
      border-color: #a855f7;
      color: #ffffff;
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(137, 30, 162, 0.4);
    }
    .nav-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
  `]
})
export class PaginationComponent implements OnChanges {
  @Input() totalItems: number = 0;
  @Input() pageSize: number = 10;
  @Input() currentPage: number = 1;
  @Input() pageSizeOptions: number[] = [5, 10, 20, 50];

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  totalPages: number = 1;
  startIndex: number = 1;
  endIndex: number = 1;

  ngOnChanges(changes: SimpleChanges): void {
    this.calculatePagination();
  }

  calculatePagination(): void {
    this.totalPages = Math.max(1, Math.ceil((this.totalItems || 0) / (this.pageSize || 10)));
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    this.startIndex = this.totalItems > 0 ? (this.currentPage - 1) * this.pageSize + 1 : 0;
    this.endIndex = Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.calculatePagination();
    this.pageChange.emit(this.currentPage);
  }

  onPageSizeSelect(size: any): void {
    const newSize = Number(size);
    if (newSize === this.pageSize) return;
    this.pageSize = newSize;
    this.currentPage = 1;
    this.calculatePagination();
    this.pageSizeChange.emit(this.pageSize);
    this.pageChange.emit(this.currentPage);
  }

  getDisplayedPages(): number[] {
    const pages: number[] = [];
    const maxButtons = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxButtons / 2));
    let end = Math.min(this.totalPages, start + maxButtons - 1);

    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }
}
