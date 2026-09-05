import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

interface LeaveApproval {
  id: number;
  leaveApplication: {
    id: number;
    employee: { id: number; firstName: string; lastName: string; employeeCode: string };
    leaveType: { typeName: string };
    startDate: string; endDate: string; totalDays: number; reason: string; status: string;
  };
  approver: { id: number; firstName: string; lastName: string };
  action: string; comments: string; status: string; actionDate: string;
}

@Component({
  selector: 'app-leave-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2 class="page-title">✔️ Leave Approvals</h2>
          <p class="page-subtitle">Review and approve/reject leave requests</p>
        </div>
        <span class="badge badge-warning" style="font-size:0.85rem;padding:8px 16px;">
          {{ pendingCount() }} Pending
        </span>
      </div>

      <div class="filter-bar">
        <select class="form-control" style="width:160px;" [(ngModel)]="filterStatus" (ngModelChange)="applyFilter()" id="appr-status-filter">
          <option value="">All Status</option>
          <option>PENDING</option><option>APPROVED</option><option>REJECTED</option>
        </select>
      </div>

      <div class="card" style="padding:0; overflow:hidden;">
        @if (isLoading()) {
          <div class="flex-center" style="padding:60px;"><div class="spinner spinner-lg"></div></div>
        } @else if (filtered().length === 0) {
          <div class="empty-state"><div class="empty-icon">✔️</div><h3>No pending approvals</h3></div>
        } @else {
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employee</th><th>Leave Type</th><th>From</th><th>To</th>
                  <th>Days</th><th>Reason</th><th>Applied</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (a of filtered(); track a.id) {
                  <tr>
                    <td>
                      <div style="font-weight:600;">{{ a.leaveApplication.employee.firstName }} {{ a.leaveApplication.employee.lastName }}</div>
                      <div style="font-size:0.75rem;color:var(--text-muted);">{{ a.leaveApplication.employee.employeeCode }}</div>
                    </td>
                    <td>{{ a.leaveApplication.leaveType?.typeName }}</td>
                    <td>{{ fmt(a.leaveApplication.startDate) }}</td>
                    <td>{{ fmt(a.leaveApplication.endDate) }}</td>
                    <td><span class="badge badge-info">{{ a.leaveApplication.totalDays }}</span></td>
                    <td style="max-width:180px;" class="truncate">{{ a.leaveApplication.reason }}</td>
                    <td>{{ fmt(a.actionDate) }}</td>
                    <td><span class="badge" [class]="badge(a.leaveApplication.status)">{{ a.leaveApplication.status }}</span></td>
                    <td>
                      @if (a.leaveApplication.status === 'PENDING') {
                        <div style="display:flex; gap:6px;">
                          <button class="btn btn-success btn-sm" (click)="openAction(a, 'APPROVED')" [id]="'approve-'+a.id">✅ Approve</button>
                          <button class="btn btn-danger btn-sm"  (click)="openAction(a, 'REJECTED')" [id]="'reject-'+a.id">❌ Reject</button>
                        </div>
                      } @else {
                        <span style="font-size:0.8rem;color:var(--text-muted);">{{ a.action }}</span>
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

    <!-- Action Modal -->
    @if (selected()) {
      <div class="overlay" (click)="closeAction()">
        <div class="modal" (click)="$event.stopPropagation()" style="max-width:440px;">
          <div class="modal-header">
            <h3 class="modal-title">{{ actionType() === 'APPROVED' ? '✅ Approve' : '❌ Reject' }} Leave</h3>
            <span class="cursor-pointer" (click)="closeAction()" id="close-action-modal">✕</span>
          </div>

          <div style="background:var(--bg-input);border-radius:var(--border-radius-sm);padding:14px;margin-bottom:20px;">
            <div style="font-weight:600;margin-bottom:4px;">
              {{ selected()?.leaveApplication.employee.firstName }} {{ selected()?.leaveApplication.employee.lastName }}
            </div>
            <div style="font-size:0.85rem;color:var(--text-secondary);">
              {{ selected()?.leaveApplication.leaveType?.typeName }} |
              {{ fmt(selected()?.leaveApplication.startDate!) }} – {{ fmt(selected()?.leaveApplication.endDate!) }} |
              {{ selected()?.leaveApplication.totalDays }} day(s)
            </div>
            @if (selected()?.leaveApplication.reason) {
              <div style="font-size:0.8rem;color:var(--text-muted);margin-top:6px;">{{ selected()?.leaveApplication.reason }}</div>
            }
          </div>

          <div class="form-group">
            <label class="form-label">Comments {{ actionType() === 'REJECTED' ? '(Required)' : '(Optional)' }}</label>
            <textarea class="form-control" rows="3" [(ngModel)]="comments" id="approval-comments"
                      [placeholder]="actionType()==='REJECTED' ? 'Please provide reason for rejection…' : 'Optional remarks…'"
                      style="resize:vertical;"></textarea>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeAction()" id="cancel-action-btn">Cancel</button>
            <button class="btn" [class]="actionType()==='APPROVED' ? 'btn-success' : 'btn-danger'"
                    (click)="submitAction()" [disabled]="submitting()" id="confirm-action-btn">
              @if (submitting()) { <div class="spinner"></div> }
              {{ actionType() === 'APPROVED' ? 'Approve' : 'Reject' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class LeaveApprovalsComponent implements OnInit {
  private api   = inject(ApiService);
  private toast = inject(ToastService);

  approvals  = signal<LeaveApproval[]>([]);
  filtered   = signal<LeaveApproval[]>([]);
  isLoading  = signal(true);
  submitting = signal(false);
  selected   = signal<LeaveApproval | null>(null);
  actionType = signal<'APPROVED'|'REJECTED'>('APPROVED');
  filterStatus = '';
  comments = '';

  pendingCount = () => this.approvals().filter(a => a.leaveApplication.status === 'PENDING').length;

  ngOnInit() { this.load(); }

  load() {
    this.isLoading.set(true);
    this.api.post<LeaveApproval[]>('/v1/leave-approvals/list', {}).subscribe({
      next: r => { this.approvals.set(r.data ?? []); this.applyFilter(); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  applyFilter() {
    let list = this.approvals();
    if (this.filterStatus) list = list.filter(a => a.leaveApplication.status === this.filterStatus);
    this.filtered.set(list);
  }

  openAction(a: LeaveApproval, type: 'APPROVED'|'REJECTED') {
    this.selected.set(a); this.actionType.set(type); this.comments = '';
  }
  closeAction() { this.selected.set(null); }

  submitAction() {
    if (this.actionType() === 'REJECTED' && !this.comments.trim()) {
      this.toast.warning('Please provide rejection reason.'); return;
    }
    this.submitting.set(true);
    const payload = {
      id: this.selected()?.id,
      action: this.actionType(), comments: this.comments, status: this.actionType()
    };
    this.api.post('/v1/leave-approvals/create', payload).subscribe({
      next: () => {
        this.toast.success(`Leave ${this.actionType() === 'APPROVED' ? 'approved' : 'rejected'} successfully.`);
        this.closeAction(); this.load(); this.submitting.set(false);
      },
      error: () => this.submitting.set(false)
    });
  }

  fmt(d: string) { return d ? new Date(d).toLocaleDateString('en-IN') : '—'; }
  badge(s: string) {
    const m: Record<string,string> = { PENDING:'badge-warning', APPROVED:'badge-success', REJECTED:'badge-danger' };
    return m[s] ?? 'badge-info';
  }
}
