import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

interface AttendanceRecord {
  id: number;
  employee: { id: number; firstName: string; lastName: string; employeeCode: string };
  attendanceDate: string;
  shift?: { shiftName: string };
  inTime: string; outTime: string; totalHours: number;
  status: string; isLate: boolean; isEarlyDeparture: boolean;
  overtimeHours: number; remarks: string;
}

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2 class="page-title">🕐 Attendance Records</h2>
          <p class="page-subtitle">Daily attendance log for all employees</p>
        </div>
        <button class="btn btn-primary" (click)="openMarkModal()" id="mark-att-btn">➕ Mark Attendance</button>
      </div>

      <!-- Stats -->
      <div class="grid grid-4" style="margin-bottom:24px;">
        <div class="stat-card"><div class="stat-icon">📋</div>
          <div class="stat-info"><div class="stat-value">{{ records().length }}</div><div class="stat-label">Total Records</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:var(--success-subtle);">🟢</div>
          <div class="stat-info"><div class="stat-value" style="color:var(--success);">{{ count('PRESENT') }}</div><div class="stat-label">Present</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:var(--danger-subtle);">🔴</div>
          <div class="stat-info"><div class="stat-value" style="color:var(--danger);">{{ count('ABSENT') }}</div><div class="stat-label">Absent</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:var(--warning-subtle);">🟡</div>
          <div class="stat-info"><div class="stat-value" style="color:var(--warning);">{{ count('HALF_DAY') }}</div><div class="stat-label">Half Day</div></div></div>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <div class="search-box form-group" style="margin-bottom:0;flex:1;">
          <span class="search-icon">🔍</span>
          <input class="form-control" placeholder="Search employee…" [(ngModel)]="search" (ngModelChange)="applyFilter()" id="att-search" />
        </div>
        <input type="date" class="form-control" style="width:160px;" [(ngModel)]="filterDate" (ngModelChange)="applyFilter()" id="att-date-filter" />
        <select class="form-control" style="width:140px;" [(ngModel)]="filterStatus" (ngModelChange)="applyFilter()" id="att-status-filter">
          <option value="">All Status</option>
          <option>PRESENT</option><option>ABSENT</option><option>HALF_DAY</option><option>LEAVE</option><option>HOLIDAY</option>
        </select>
      </div>

      <div class="card" style="padding:0; overflow:hidden;">
        @if (isLoading()) {
          <div class="flex-center" style="padding:60px;"><div class="spinner spinner-lg"></div></div>
        } @else if (filtered().length === 0) {
          <div class="empty-state"><div class="empty-icon">🕐</div><h3>No attendance records</h3></div>
        } @else {
          <div class="table-wrapper">
            <table>
              <thead><tr>
                <th>Employee</th><th>Date</th><th>Shift</th>
                <th>In Time</th><th>Out Time</th><th>Hours</th>
                <th>Overtime</th><th>Status</th><th>Flags</th>
              </tr></thead>
              <tbody>
                @for (r of filtered(); track r.id) {
                  <tr>
                    <td>
                      <div style="font-weight:600;">{{ r.employee.firstName }} {{ r.employee.lastName }}</div>
                      <div style="font-size:0.75rem;color:var(--text-muted);">{{ r.employee.employeeCode }}</div>
                    </td>
                    <td>{{ fmt(r.attendanceDate) }}</td>
                    <td>{{ r.shift?.shiftName || '—' }}</td>
                    <td><span style="color:var(--success);font-weight:600;">{{ r.inTime || '—' }}</span></td>
                    <td><span style="color:var(--danger);font-weight:600;">{{ r.outTime || '—' }}</span></td>
                    <td>{{ r.totalHours ? r.totalHours + ' hrs' : '—' }}</td>
                    <td>{{ r.overtimeHours ? r.overtimeHours + ' hrs' : '—' }}</td>
                    <td><span class="badge" [class]="attBadge(r.status)">{{ r.status }}</span></td>
                    <td>
                      <div style="display:flex;gap:4px;flex-wrap:wrap;">
                        @if (r.isLate) { <span class="badge badge-warning" style="font-size:0.65rem;">LATE</span> }
                        @if (r.isEarlyDeparture) { <span class="badge badge-danger" style="font-size:0.65rem;">EARLY OUT</span> }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>

    <!-- Mark Attendance Modal -->
    @if (showModal()) {
      <div class="overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">🕐 Mark Attendance</h3>
            <span class="cursor-pointer" (click)="closeModal()" id="close-att-modal">✕</span>
          </div>
          <div class="grid grid-2">
            <div class="form-group">
              <label class="form-label">Date *</label>
              <input type="date" class="form-control" [(ngModel)]="form.attendanceDate" id="att-form-date" />
            </div>
            <div class="form-group">
              <label class="form-label">Status *</label>
              <select class="form-control" [(ngModel)]="form.status" id="att-form-status">
                <option>PRESENT</option><option>ABSENT</option><option>HALF_DAY</option><option>LEAVE</option><option>HOLIDAY</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">In Time</label>
              <input type="time" class="form-control" [(ngModel)]="form.inTime" id="att-form-in" />
            </div>
            <div class="form-group">
              <label class="form-label">Out Time</label>
              <input type="time" class="form-control" [(ngModel)]="form.outTime" id="att-form-out" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Remarks</label>
            <input class="form-control" [(ngModel)]="form.remarks" placeholder="Optional remarks" id="att-form-remarks" />
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()" id="cancel-att-modal">Cancel</button>
            <button class="btn btn-primary" (click)="submit()" [disabled]="submitting()" id="submit-att-btn">
              @if (submitting()) { <div class="spinner"></div> } Save
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AttendanceListComponent implements OnInit {
  private api   = inject(ApiService);
  private toast = inject(ToastService);

  records   = signal<AttendanceRecord[]>([]);
  filtered  = signal<AttendanceRecord[]>([]);
  isLoading = signal(true);
  submitting = signal(false);
  showModal  = signal(false);
  search = ''; filterDate = ''; filterStatus = '';
  form = { attendanceDate: '', status: 'PRESENT', inTime: '', outTime: '', remarks: '' };

  count(s: string) { return this.records().filter(r => r.status === s).length; }

  ngOnInit() { this.load(); }

  load() {
    this.isLoading.set(true);
    this.api.post<AttendanceRecord[]>('/v1/attendance/list', {}).subscribe({
      next: r => { this.records.set(r.data ?? []); this.applyFilter(); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  applyFilter() {
    let list = this.records();
    if (this.search) {
      const q = this.search.toLowerCase();
      list = list.filter(r => `${r.employee.firstName} ${r.employee.lastName}`.toLowerCase().includes(q) || r.employee.employeeCode.includes(q));
    }
    if (this.filterDate)   list = list.filter(r => r.attendanceDate === this.filterDate);
    if (this.filterStatus) list = list.filter(r => r.status === this.filterStatus);
    this.filtered.set(list);
  }

  openMarkModal() { this.form = { attendanceDate: new Date().toISOString().split('T')[0], status: 'PRESENT', inTime: '', outTime: '', remarks: '' }; this.showModal.set(true); }
  closeModal()    { this.showModal.set(false); }

  submit() {
    if (!this.form.attendanceDate) { this.toast.warning('Date is required.'); return; }
    this.submitting.set(true);
    this.api.post('/v1/attendance/create', this.form).subscribe({
      next: () => { this.toast.success('Attendance saved!'); this.closeModal(); this.load(); this.submitting.set(false); },
      error: () => this.submitting.set(false)
    });
  }

  fmt(d: string)  { return d ? new Date(d).toLocaleDateString('en-IN') : '—'; }
  attBadge(s: string) {
    const m: Record<string,string> = { PRESENT:'badge-success', ABSENT:'badge-danger', HALF_DAY:'badge-warning', LEAVE:'badge-info', HOLIDAY:'badge-primary' };
    return m[s] ?? 'badge-info';
  }
}
