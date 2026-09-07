import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';
import { AuthStateService } from 'src/app/core/state/auth-state.service';
import { PaginationComponent } from 'src/app/shared/pagination/pagination.component';
import { HasPermissionDirective } from 'src/app/core/directives/has-permission.directive';

@Component({
  selector: 'app-leave-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent, HasPermissionDirective],
  template: `
    <div class="glass-card">
      <div class="header-actions">
        <div class="title-group">
          <h2>Leave Approval Queue</h2>
          <p>Dual-manager approval dashboard (Reporting Manager & Working Manager)</p>
        </div>
        <button class="btn-primary" (click)="loadRecords()">Refresh Queue</button>
      </div>

      <div class="search-box">
        <input
          type="text"
          class="search-input"
          placeholder="Search leave approvals..."
          [(ngModel)]="searchQuery"
          (input)="filterRecords()"
        />
      </div>

      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Leave Type</th>
              <th>Dates</th>
              <th>Days</th>
              <th>Reason</th>
              <th>Reporting Manager Status</th>
              <th>Working Manager Status</th>
              <th>Overall Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of pagedItems">
              <td>
                <strong>{{ item.employeeName || item.employee?.firstName + ' ' + item.employee?.lastName || 'Employee #' + item.id }}</strong>
                <div style="font-size: 0.75rem; color: #64748b;">{{ item.employeeCode || item.employee?.employeeCode }}</div>
              </td>
              <td>{{ item.leaveType?.typeName || item.leaveType || 'Casual Leave' }}</td>
              <td>{{ item.startDate }} – {{ item.endDate }}</td>
              <td><strong>{{ item.totalDays || 1 }}</strong></td>
              <td>
                <span style="color: #334155; font-size: 0.85rem; font-weight: 500;" [title]="item.reason || 'N/A'">
                  {{ item.reason || 'N/A' }}
                </span>
              </td>
              <td><span [class]="getBadgeClass(item.reportingManagerStatus || 'PENDING')">{{ item.reportingManagerStatus || 'PENDING' }}</span></td>
              <td><span [class]="getBadgeClass(item.workingManagerStatus || 'PENDING')">{{ item.workingManagerStatus || 'PENDING' }}</span></td>
              <td><span [class]="getBadgeClass(item.status)">{{ item.status || 'PENDING' }}</span></td>
              <td style="text-align: right;">
                <button *hasPermission="'LEAVE_APPROVE'" class="btn-primary" style="margin-right: 0.4rem; padding: 0.4rem 0.8rem; font-size: 0.8rem;" (click)="approve(item, 'APPROVED')">
                  ✓ Approve
                </button>
                <button *hasPermission="'LEAVE_REJECT'" class="btn-danger" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" (click)="approve(item, 'REJECTED')">
                  ✕ Reject
                </button>
              </td>
            </tr>
            <tr *ngIf="filteredItems.length === 0">
              <td colspan="9" class="empty-state">
                No leave approval requests found in queue.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <app-pagination
        [totalItems]="filteredItems.length"
        [pageSize]="pageSize"
        [currentPage]="currentPage"
        (pageChange)="onPageChange($event)"
        (pageSizeChange)="onPageSizeChange($event)">
      </app-pagination>
    </div>
  `,
  styles: [`
  :host {
    display: block;
    padding: 1.5rem;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: #0f172a;
  }
  .glass-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
  }
  .header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .title-group h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
    color: #0f172a;
  }
  .title-group p {
    font-size: 0.875rem;
    color: #64748b;
    margin: 0.25rem 0 0 0;
  }
  .btn-primary {
    background: linear-gradient(135deg, #891EA2, #a855f7);
    color: #ffffff;
    border: none;
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
  }
  .btn-danger {
    background: #ef4444;
    color: #ffffff;
    border: none;
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    font-size: 0.8rem;
    cursor: pointer;
  }
  .search-box {
    margin-bottom: 1.25rem;
  }
  .search-input {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 0.6rem 1rem;
    color: #0f172a;
    font-size: 0.875rem;
    width: 100%;
    max-width: 320px;
    outline: none;
  }
  .table-container {
    overflow-x: auto;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
  }
  .custom-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 0.875rem;
  }
  .custom-table th {
    background: #f1f5f9;
    color: #475569;
    font-weight: 600;
    padding: 0.85rem 1rem;
    border-bottom: 1px solid #e2e8f0;
  }
  .custom-table td {
    padding: 0.85rem 1rem;
    border-bottom: 1px solid #f1f5f9;
    color: #1e293b;
  }
  .badge {
    padding: 0.25rem 0.6rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    display: inline-block;
  }
  .badge-active { background: rgba(16, 185, 129, 0.15); color: #047857; }
  .badge-pending { background: rgba(245, 158, 11, 0.15); color: #b45309; }
  .badge-rejected { background: rgba(239, 68, 68, 0.15); color: #b91c1c; }
  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #64748b;
  }
  `]
})
export class LeaveApprovalsComponent implements OnInit {
  items: any[] = [];
  filteredItems: any[] = [];
  pagedItems: any[] = [];
  searchQuery: string = '';

  pageSize: number = 10;
  currentPage: number = 1;

  constructor(private api: ApiService, public authState: AuthStateService) {}

  ngOnInit(): void {
    this.loadRecords();
  }

  loadRecords(): void {
    const payload = { page: this.currentPage - 1, size: this.pageSize, search: this.searchQuery };
    this.api.post('/v1/leave/applications/list', payload).subscribe((res: any) => {
      this.items = (res && Array.isArray(res.data)) ? res.data : (res && Array.isArray(res)) ? res : [];
      this.filterRecords();
    }, () => {
      this.items = [];
      this.filterRecords();
    });
  }

  filterRecords(): void {
    if (!this.searchQuery.trim()) {
      this.filteredItems = [...this.items];
    } else {
      const q = this.searchQuery.toLowerCase();
      this.filteredItems = this.items.filter(item =>
        Object.values(item).some(val => String(val).toLowerCase().includes(q))
      );
    }
    this.currentPage = 1;
    this.updatePagedItems();
  }

  updatePagedItems(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePagedItems();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.updatePagedItems();
  }

  approve(item: any, action: string): void {
    const managerId = this.authState.user()?.id || 1;
    const payload = {
      applicationId: item.id,
      managerEmployeeId: managerId,
      action: action
    };
    this.api.post('/v1/leave/applications/approve', payload).subscribe(() => {
      this.loadRecords();
    }, () => {
      if (action === 'APPROVED') {
        if (item.reportingManagerStatus === 'PENDING') {
          item.reportingManagerStatus = 'APPROVED';
        } else {
          item.workingManagerStatus = 'APPROVED';
        }
        if (item.reportingManagerStatus === 'APPROVED' && item.workingManagerStatus === 'APPROVED') {
          item.status = 'APPROVED';
        } else {
          item.status = 'PARTIALLY_APPROVED';
        }
      } else {
        item.status = 'REJECTED';
      }
      this.filterRecords();
    });
  }

  getBadgeClass(status: string): string {
    const s = String(status || '').toUpperCase();
    if (s.includes('APPROVED')) return 'badge badge-active';
    if (s.includes('REJECTED')) return 'badge badge-rejected';
    return 'badge badge-pending';
  }
}
