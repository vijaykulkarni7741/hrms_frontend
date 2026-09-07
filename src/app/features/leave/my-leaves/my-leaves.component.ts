import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { ToastService } from 'src/app/core/services/toast.service';

interface LeaveApplication {
  id: number;
  employee: { id: number; firstName: string; lastName: string; employeeCode: string };
  leaveType: { id: number; typeName: string };
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  createdDate: string;
}

interface LeaveType { id: number; typeName: string; typeCode: string; }

@Component({
  selector: 'app-my-leaves',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2 class="page-title">🌴 My Leave Applications</h2>
          <p class="page-subtitle">View and manage your leave requests</p>
        </div>
        <button class="btn btn-primary" (click)="openModal()" id="apply-leave-btn">
          ➕ Apply Leave
        </button>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-4" style="margin-bottom:24px;">
        <div class="stat-card"><div class="stat-icon">📋</div>
          <div class="stat-info"><div class="stat-value">{{ total() }}</div><div class="stat-label">Total Applied</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:var(--warning-subtle);">⏳</div>
          <div class="stat-info"><div class="stat-value" style="color:var(--warning);">{{ countByStatus('PENDING') }}</div><div class="stat-label">Pending</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:var(--success-subtle);">✅</div>
          <div class="stat-info"><div class="stat-value" style="color:var(--success);">{{ countByStatus('APPROVED') }}</div><div class="stat-label">Approved</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:var(--danger-subtle);">❌</div>
          <div class="stat-info"><div class="stat-value" style="color:var(--danger);">{{ countByStatus('REJECTED') }}</div><div class="stat-label">Rejected</div></div></div>
      </div>

      <!-- Filter -->
      <div class="filter-bar">
        <select class="form-control" style="width:160px;" [(ngModel)]="filterStatus" (ngModelChange)="applyFilter()" id="leave-status-filter">
          <option value="">All Status</option>
          <option>PENDING</option><option>APPROVED</option><option>REJECTED</option><option>CANCELLED</option>
        </select>
      </div>

      <!-- Table -->
      <div class="card" style="padding:0; overflow:hidden;">
        @if (isLoading()) {
          <div class="flex-center" style="padding:60px;"><div class="spinner spinner-lg"></div></div>
        } @else if (filtered().length === 0) {
          <div class="empty-state"><div class="empty-icon">🌴</div><h3>No leave applications</h3><p>Apply for a leave using the button above.</p></div>
        } @else {
          <div class="table-wrapper">
            <table>
              <thead><tr><th>Leave Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Applied On</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                @for (l of filtered(); track l.id) {
                  <tr>
                    <td><strong>{{ l.leaveType?.typeName }}</strong></td>
                    <td>{{ fmt(l.startDate) }}</td>
                    <td>{{ fmt(l.endDate) }}</td>
                    <td><span class="badge badge-info">{{ l.totalDays }} day(s)</span></td>
                    <td style="max-width:200px;" class="truncate">{{ l.reason || '—' }}</td>
                    <td>{{ fmt(l.createdDate) }}</td>
                    <td><span class="badge" [class]="statusBadge(l.status)">{{ l.status }}</span></td>
                    <td>
                      @if (l.status === 'PENDING') {
                        <button class="btn btn-danger btn-sm" (click)="cancelLeave(l)" [id]="'cancel-leave-'+l.id">Cancel</button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>

    <!-- Apply Leave Modal -->
    @if (showModal()) {
      <div class="overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">🌴 Apply for Leave</h3>
            <span class="cursor-pointer" (click)="closeModal()" id="close-leave-modal">✕</span>
          </div>

          <div class="form-group">
            <label class="form-label">Leave Type *</label>
            <select class="form-control" [(ngModel)]="form.leaveTypeId" id="leave-type-select">
              <option value="">Select leave type</option>
              @for (lt of leaveTypes(); track lt.id) {
                <option [value]="lt.id">{{ lt.typeName }}</option>
              }
            </select>
          </div>
          <div class="grid grid-2">
            <div class="form-group">
              <label class="form-label">From Date *</label>
              <input type="date" class="form-control" [(ngModel)]="form.startDate" id="leave-start-date" (change)="calcDays()" />
            </div>
            <div class="form-group">
              <label class="form-label">To Date *</label>
              <input type="date" class="form-control" [(ngModel)]="form.endDate" id="leave-end-date" (change)="calcDays()" />
            </div>
          </div>
          @if (form.totalDays > 0) {
            <div style="background:var(--primary-subtle);border-radius:var(--border-radius-sm);padding:10px 14px;margin-bottom:16px;font-size:0.875rem;color:var(--primary-light);">
              📅 Total Leave Days: <strong>{{ form.totalDays }}</strong>
            </div>
          }
          <div class="form-group">
            <label class="form-label">Reason</label>
            <textarea class="form-control" rows="3" [(ngModel)]="form.reason" placeholder="Reason for leave…" id="leave-reason" style="resize:vertical;"></textarea>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()" id="cancel-modal-btn">Cancel</button>
            <button class="btn btn-primary" (click)="submitLeave()" [disabled]="submitting()" id="submit-leave-btn">
              @if (submitting()) { <div class="spinner"></div> } Apply Leave
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class MyLeavesComponent implements OnInit {
  private api   = inject(ApiService);
  private toast = inject(ToastService);

  leaves     = signal<LeaveApplication[]>([]);
  filtered   = signal<LeaveApplication[]>([]);
  leaveTypes = signal<LeaveType[]>([]);
  isLoading  = signal(true);
  submitting = signal(false);
  showModal  = signal(false);
  filterStatus = '';
  total = signal(0);
  form = { leaveTypeId: '', startDate: '', endDate: '', reason: '', totalDays: 0 };

  ngOnInit() { this.load(); this.loadLeaveTypes(); }

  load() {
    this.isLoading.set(true);
    this.api.post<LeaveApplication[]>('/v1/leave-applications/list', {}).subscribe({
      next: (r: any) => { this.leaves.set(r.data ?? []); this.total.set(this.leaves().length); this.applyFilter(); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  loadLeaveTypes() {
    this.api.post<LeaveType[]>('/v1/leave-types/list', {}).subscribe({
      next: (r: any) => this.leaveTypes.set(r.data ?? [])
    });
  }

  applyFilter() {
    let list = this.leaves();
    if (this.filterStatus) list = list.filter(l => l.status === this.filterStatus);
    this.filtered.set(list);
  }

  countByStatus(s: string) { return this.leaves().filter(l => l.status === s).length; }

  openModal()  { this.form = { leaveTypeId: '', startDate: '', endDate: '', reason: '', totalDays: 0 }; this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }

  calcDays() {
    if (this.form.startDate && this.form.endDate) {
      const diff = (new Date(this.form.endDate).getTime() - new Date(this.form.startDate).getTime()) / 86400000;
      this.form.totalDays = diff >= 0 ? diff + 1 : 0;
    }
  }

  submitLeave() {
    if (!this.form.leaveTypeId || !this.form.startDate || !this.form.endDate) {
      this.toast.warning('Please fill all required fields.'); return;
    }
    this.submitting.set(true);
    const payload = {
      leaveType: { id: this.form.leaveTypeId },
      startDate: this.form.startDate, endDate: this.form.endDate,
      totalDays: this.form.totalDays, reason: this.form.reason, status: 'PENDING'
    };
    this.api.post('/v1/leave-applications/create', payload).subscribe({
      next: () => {
        this.toast.success('Leave application submitted!');
        this.closeModal(); this.load(); this.submitting.set(false);
      },
      error: () => this.submitting.set(false)
    });
  }

  cancelLeave(l: LeaveApplication) {
    this.api.post('/v1/leave-applications/toggle-active', { id: l.id }).subscribe({
      next: () => { this.toast.success('Leave cancelled.'); this.load(); }
    });
  }

  fmt(d: string) { return d ? new Date(d).toLocaleDateString('en-IN') : '—'; }
  statusBadge(s: string) {
    const m: Record<string, string> = { PENDING: 'badge-warning', APPROVED: 'badge-success', REJECTED: 'badge-danger', CANCELLED: 'badge-info' };
    return m[s] ?? 'badge-info';
  }
}
