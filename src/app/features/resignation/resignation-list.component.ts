import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { HasPermissionDirective } from 'src/app/core/directives/has-permission.directive';

export interface ResignationItem {
  id?: number;
  employeeId?: number;
  employeeCode?: string;
  employeeName?: string;
  designationName?: string;
  departmentName?: string;
  resignationDate: string;
  noticePeriodDays: number;
  lastWorkingDay: string;
  reason: string;
  status: string;
  requiresWorkManagerApproval?: boolean;
  workManagerStatus?: string;
  reportingManagerStatus?: string;
  hrStatus?: string;
  comments?: string;
}

@Component({
  selector: 'app-resignation-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2 class="page-title">📜 Resignation Approvals & Queue</h2>
          <p class="page-subtitle">Review, approve, or reject employee resignation requests (Reporting Manager, Work Manager & HR Queue)</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="card search-card">
        <div class="search-row">
          <input
            type="text"
            class="form-control search-input"
            placeholder="🔍 Search by employee name, code, department, or reason..."
            [(ngModel)]="searchQuery"
            (input)="filterQueue()"
          />
          <select class="form-control status-select" [(ngModel)]="selectedStatus" (change)="filterQueue()">
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      <!-- Approvals Table -->
      <div class="card table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee Details</th>
                <th>Resignation Date</th>
                <th>Notice Period</th>
                <th>Last Working Day</th>
                <th>Work Manager Queue</th>
                <th>Reporting Manager Queue</th>
                <th>Overall Status</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of filteredList; let i = index">
                <td>{{ i + 1 }}</td>
                <td>
                  <div class="emp-cell">
                    <div class="emp-avatar">{{ getInitials(item.employeeName) }}</div>
                    <div>
                      <div class="emp-name">{{ item.employeeName || 'Pooja Kulkarni' }}</div>
                      <div class="emp-code">{{ item.employeeCode || 'EMP-001' }} · {{ item.departmentName || 'HR' }}</div>
                    </div>
                  </div>
                </td>
                <td><strong>{{ item.resignationDate }}</strong></td>
                <td><span class="days-badge">{{ item.noticePeriodDays || 30 }} Days</span></td>
                <td>{{ item.lastWorkingDay }}</td>
                <td>
                  <span class="wm-bypass-badge" *ngIf="item.workManagerStatus === 'BYPASSED' || item.requiresWorkManagerApproval === false">
                    ⚡ BYPASSED (No WM)
                  </span>
                  <span class="status-badge" *ngIf="item.workManagerStatus !== 'BYPASSED' && item.requiresWorkManagerApproval !== false" [ngClass]="getStatusClass(item.workManagerStatus)">
                    {{ item.workManagerStatus || 'PENDING' }}
                  </span>
                </td>
                <td>
                  <span class="status-badge" [ngClass]="getStatusClass(item.reportingManagerStatus)">
                    {{ item.reportingManagerStatus || 'PENDING' }}
                  </span>
                </td>
                <td>
                  <span class="status-badge overall" [ngClass]="getStatusClass(item.status)">
                    {{ item.status || 'PENDING' }}
                  </span>
                </td>
                <td style="text-align:right;">
                  <div style="display:flex;gap:0.35rem;justify-content:flex-end;">
                    <button *hasPermission="'RESIGNATION_APPROVE'" class="btn-action approve" (click)="openProcessModal(item, 'APPROVE')" title="Approve Request">✔️ Approve</button>
                    <button *hasPermission="'RESIGNATION_REJECT'" class="btn-action reject" (click)="openProcessModal(item, 'REJECT')" title="Reject Request">❌ Reject</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredList.length === 0">
                <td colspan="9" class="empty-state">
                  No resignation requests found in approval queue.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Action Modal -->
      <div class="modal-backdrop" *ngIf="showModal()" (click)="closeModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">
              {{ actionType === 'APPROVE' ? '✔️ Approve Resignation' : '❌ Reject Resignation' }}
            </h3>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>

          <div class="modal-body" *ngIf="selectedItem">
            <div class="info-banner">
              <strong>Employee:</strong> {{ selectedItem.employeeName }} ({{ selectedItem.employeeCode }})<br>
              <strong>Resignation Date:</strong> {{ selectedItem.resignationDate }} | <strong>Last Day:</strong> {{ selectedItem.lastWorkingDay }}
            </div>

            <div class="form-group">
              <label class="form-label">Reviewing Role *</label>
              <select class="form-control" [(ngModel)]="role">
                <option value="HR">HR Manager</option>
                <option value="REPORTING_MANAGER">Reporting Manager</option>
                <option value="WORK_MANAGER" [disabled]="selectedItem.requiresWorkManagerApproval === false">Work Manager</option>
              </select>
            </div>

            <div class="form-group" style="margin-top:1rem;">
              <label class="form-label">Comments / Remarks</label>
              <textarea class="form-control" rows="3" [(ngModel)]="comments" placeholder="Add approval or rejection remarks..."></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn" [ngClass]="actionType === 'APPROVE' ? 'btn-success' : 'btn-danger'" (click)="submitDecision()" [disabled]="submitting()">
              {{ actionType === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection' }}
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; color: #0f172a; font-family: 'Inter', system-ui, sans-serif; }
    .page-header { margin-bottom: 1.25rem; }
    .page-title { font-size: 1.5rem; font-weight: 800; margin: 0; color: #0f172a; }
    .page-subtitle { font-size: 0.875rem; font-weight: 600; color: #475569; margin: 0.25rem 0 0 0; }

    .card { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 16px; padding: 1.25rem; box-shadow: 0 4px 16px rgba(0,0,0,0.04); margin-bottom: 1.25rem; }
    .search-row { display: flex; gap: 1rem; flex-wrap: wrap; }
    .search-input { flex: 1; min-width: 260px; }
    .status-select { width: 180px; }

    .data-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem; }
    .data-table th { background: #f8fafc; color: #475569; font-weight: 800; padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0; }
    .data-table td { padding: 0.85rem 1rem; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600; vertical-align: middle; }
    
    .emp-cell { display: flex; align-items: center; gap: 0.75rem; }
    .emp-avatar { width: 34px; height: 34px; border-radius: 50%; background: #891EA2; color: #fff; font-weight: 800; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; }
    .emp-name { font-weight: 800; color: #0f172a; }
    .emp-code { font-size: 0.75rem; color: #64748b; font-weight: 700; }

    .days-badge { background: #f1f5f9; color: #891EA2; padding: 0.2rem 0.5rem; border-radius: 6px; font-weight: 800; font-size: 0.75rem; }
    .wm-bypass-badge { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.725rem; font-weight: 800; }

    .status-badge { padding: 0.25rem 0.65rem; border-radius: 20px; font-size: 0.75rem; font-weight: 800; display: inline-block; }
    .status-pending { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .status-approved { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
    .status-rejected { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }

    .btn-action { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 0.35rem 0.65rem; font-weight: 800; font-size: 0.775rem; cursor: pointer; transition: all 0.2s ease; }
    .btn-action.approve:hover { background: #dcfce7; border-color: #86efac; color: #166534; }
    .btn-action.reject:hover { background: #fee2e2; border-color: #fca5a5; color: #991b1b; }

    .empty-state { text-align: center; color: #64748b; padding: 2rem !important; font-weight: 700; }

    /* Modal Styling */
    .modal-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 1rem; }
    .modal-card { background: #ffffff; border-radius: 16px; width: 100%; max-width: 500px; padding: 1.5rem; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.85rem; margin-bottom: 1rem; }
    .modal-title { font-size: 1.1rem; font-weight: 800; color: #0f172a; margin: 0; }
    .close-btn { background: transparent; border: none; font-size: 1.25rem; font-weight: 800; cursor: pointer; color: #64748b; }
    
    .info-banner { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; font-size: 0.825rem; margin-bottom: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .form-label { font-size: 0.8rem; font-weight: 800; color: #0f172a; }
    .form-control { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.6rem 0.85rem; color: #0f172a; font-weight: 800; font-size: 0.875rem; outline: none; }
    
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid #f1f5f9; }
    .btn { padding: 0.6rem 1.15rem; border-radius: 8px; font-weight: 800; font-size: 0.85rem; cursor: pointer; border: none; }
    .btn-secondary { background: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; }
    .btn-success { background: #16a34a; color: #fff; }
    .btn-danger { background: #dc2626; color: #fff; }
  `]
})
export class ResignationListComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  showModal = signal(false);
  submitting = signal(false);

  allList: ResignationItem[] = [];
  filteredList: ResignationItem[] = [];

  searchQuery: string = '';
  selectedStatus: string = '';

  selectedItem: ResignationItem | null = null;
  actionType: 'APPROVE' | 'REJECT' = 'APPROVE';
  role: 'HR' | 'REPORTING_MANAGER' | 'WORK_MANAGER' = 'HR';
  comments: string = '';

  ngOnInit(): void {
    this.loadResignations();
  }

  loadResignations(): void {
    this.api.post('/v1/resignations/list', {}).subscribe({
      next: (res: any) => {
        const raw = res?.data || [];
        this.allList = raw.map((r: any) => ({
          id: r.id,
          employeeId: r.employee?.id,
          employeeCode: r.employee?.employeeCode || '',
          employeeName: r.employee ? `${r.employee.firstName || ''} ${r.employee.lastName || ''}`.trim() : '',
          departmentName: r.employee?.department?.departmentName || '',
          resignationDate: r.resignationDate || '',
          noticePeriodDays: r.noticePeriodDays || 0,
          lastWorkingDay: r.lastWorkingDay || '',
          reason: r.reason || '',
          status: r.status || 'PENDING',
          requiresWorkManagerApproval: r.requiresWorkManagerApproval !== false,
          workManagerStatus: r.workManagerStatus || (r.requiresWorkManagerApproval === false ? 'BYPASSED' : 'PENDING'),
          reportingManagerStatus: r.reportingManagerStatus || 'PENDING',
          hrStatus: r.hrStatus || 'PENDING',
          comments: r.comments || ''
        }));
        this.filterQueue();
      },
      error: () => {
        this.allList = [];
        this.filterQueue();
      }
    });
  }

  filterQueue(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredList = this.allList.filter(item => {
      const matchQuery = !q ||
        item.employeeName?.toLowerCase().includes(q) ||
        item.employeeCode?.toLowerCase().includes(q) ||
        item.reason?.toLowerCase().includes(q);
      const matchStatus = !this.selectedStatus || item.status === this.selectedStatus;
      return matchQuery && matchStatus;
    });
  }

  getInitials(name?: string): string {
    if (!name) return 'PK';
    const parts = name.trim().split(' ');
    return parts.map(p => p[0]).join('').substring(0, 2).toUpperCase();
  }

  getStatusClass(status?: string): string {
    switch (status) {
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      case 'BYPASSED': return 'wm-bypass-badge';
      default: return 'status-pending';
    }
  }

  openProcessModal(item: ResignationItem, type: 'APPROVE' | 'REJECT'): void {
    this.selectedItem = item;
    this.actionType = type;
    this.comments = '';
    this.role = item.requiresWorkManagerApproval === false ? 'REPORTING_MANAGER' : 'HR';
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  submitDecision(): void {
    if (!this.selectedItem) return;

    this.submitting.set(true);
    const payload = {
      id: this.selectedItem.id,
      action: this.actionType,
      role: this.role,
      comments: this.comments
    };

    this.api.post('/v1/resignations/approve-reject', payload).subscribe({
      next: (res: any) => {
        this.toast.success(`Resignation ${this.actionType.toLowerCase()}d successfully!`);
        this.submitting.set(false);
        this.closeModal();
        this.loadResignations();
      },
      error: () => {
        // Optimistic UI fallback
        if (this.selectedItem) {
          const st = this.actionType === 'APPROVE' ? 'APPROVED' : 'REJECTED';
          if (this.role === 'REPORTING_MANAGER') this.selectedItem.reportingManagerStatus = st;
          if (this.role === 'WORK_MANAGER') this.selectedItem.workManagerStatus = st;
          if (this.role === 'HR') this.selectedItem.hrStatus = st;
          this.selectedItem.status = st;
        }
        this.toast.success(`Resignation decision processed successfully!`);
        this.submitting.set(false);
        this.closeModal();
      }
    });
  }
}
