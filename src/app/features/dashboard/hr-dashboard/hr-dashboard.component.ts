import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { AuthStateService } from 'src/app/core/state/auth-state.service';

@Component({
  selector: 'app-hr-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">

      <div class="page-header">
        <div>
          <h2 class="page-title">🧑‍💼 HR Dashboard</h2>
          <p class="page-subtitle">{{ authState.fullName() }} · {{ today }}</p>
        </div>
        <div style="display:flex;gap:8px;">
          <a class="btn btn-primary" routerLink="/employees/new" id="hr-add-emp-btn">➕ Add Employee</a>
          <a class="btn btn-secondary" routerLink="/payroll/process" id="hr-payroll-btn">💰 Process Payroll</a>
        </div>
      </div>

      <!-- KPI Row 1 -->
      <div class="grid grid-4" style="margin-bottom:20px;">
        <div class="stat-card" routerLink="/employees">
          <div class="stat-icon">👥</div>
          <div class="stat-info"><div class="stat-value">{{ stats().totalEmployees }}</div><div class="stat-label">Total Employees</div></div>
        </div>
        <div class="stat-card" routerLink="/attendance">
          <div class="stat-icon" style="background:var(--success-subtle);">🟢</div>
          <div class="stat-info"><div class="stat-value" style="color:var(--success);">{{ stats().presentToday }}</div><div class="stat-label">Present Today</div></div>
        </div>
        <div class="stat-card" routerLink="/leave/approvals">
          <div class="stat-icon" style="background:var(--warning-subtle);">📋</div>
          <div class="stat-info"><div class="stat-value" style="color:var(--warning);">{{ stats().pendingLeaveApprovals }}</div><div class="stat-label">Pending Leave Approvals</div></div>
        </div>
        <div class="stat-card" routerLink="/payroll/slips">
          <div class="stat-icon" style="background:var(--info-subtle);">💰</div>
          <div class="stat-info"><div class="stat-value" style="color:var(--info);">₹{{ formatL(stats().monthlyPayroll) }}L</div><div class="stat-label">Payroll This Month</div></div>
        </div>
      </div>

      <!-- KPI Row 2 -->
      <div class="grid grid-4" style="margin-bottom:24px;">
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--danger-subtle);">🔴</div>
          <div class="stat-info"><div class="stat-value" style="color:var(--danger);">{{ stats().absentToday }}</div><div class="stat-label">Absent Today</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--warning-subtle);">⏰</div>
          <div class="stat-info"><div class="stat-value" style="color:var(--warning);">{{ stats().lateArrivals }}</div><div class="stat-label">Late Arrivals</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--success-subtle);">🆕</div>
          <div class="stat-info"><div class="stat-value" style="color:var(--success);">{{ stats().newJoineesMonth }}</div><div class="stat-label">New Joinees (Month)</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--danger-subtle);">🚪</div>
          <div class="stat-info"><div class="stat-value" style="color:var(--danger);">{{ stats().exitingMonth }}</div><div class="stat-label">Exits (Month)</div></div>
        </div>
      </div>

      <div class="grid grid-2" style="margin-bottom:24px;">

        <!-- Early Arrivals & Late -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">⏰ Today's Punctuality</span>
            <a class="btn btn-secondary btn-sm" routerLink="/attendance">View All</a>
          </div>
          <div style="display:flex;flex-direction:column;gap:14px;">
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                <span style="font-size:0.82rem;color:var(--success);">✅ On Time / Early</span>
                <strong style="color:var(--success);">{{ stats().onTimeArrivals }}</strong>
              </div>
              <div class="att-bar-wrap"><div class="att-bar" style="background:var(--success);width:{{ onTimePct() }}%"></div></div>
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                <span style="font-size:0.82rem;color:var(--warning);">⏰ Late Arrivals</span>
                <strong style="color:var(--warning);">{{ stats().lateArrivals }}</strong>
              </div>
              <div class="att-bar-wrap"><div class="att-bar" style="background:var(--warning);width:{{ latePct() }}%"></div></div>
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                <span style="font-size:0.82rem;color:var(--info);">🏃 Early Departures</span>
                <strong style="color:var(--info);">{{ stats().earlyDepartures }}</strong>
              </div>
              <div class="att-bar-wrap"><div class="att-bar" style="background:var(--info);width:{{ earlyPct() }}%"></div></div>
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                <span style="font-size:0.82rem;color:var(--danger);">🔴 Absent</span>
                <strong style="color:var(--danger);">{{ stats().absentToday }}</strong>
              </div>
              <div class="att-bar-wrap"><div class="att-bar" style="background:var(--danger);width:{{ absentPct() }}%"></div></div>
            </div>
          </div>
        </div>

        <!-- Leave Requests -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">🌴 Pending Leave Requests</span>
            <a class="btn btn-secondary btn-sm" routerLink="/leave/approvals">Approve</a>
          </div>
          @if (pendingLeaves().length === 0) {
            <div class="empty-state" style="padding:30px;">
              <div class="empty-icon" style="font-size:2rem;">✅</div>
              <h3 style="font-size:0.9rem;">No pending leave requests</h3>
            </div>
          } @else {
            <div style="display:flex;flex-direction:column;gap:8px;">
              @for (l of pendingLeaves(); track l.id) {
                <div class="leave-req-item">
                  <div class="emp-mini-avatar">{{ l.initials }}</div>
                  <div style="flex:1;">
                    <div style="font-weight:600;font-size:0.85rem;">{{ l.name }}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted);">{{ l.leaveType }} · {{ l.days }} day(s) · {{ l.from }}</div>
                  </div>
                  <div style="display:flex;gap:6px;">
                    <a class="btn btn-success btn-sm" [id]="'hr-approve-'+l.id" routerLink="/leave/approvals">✅</a>
                    <a class="btn btn-danger btn-sm"  [id]="'hr-reject-'+l.id"  routerLink="/leave/approvals">❌</a>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Bottom Row -->
      <div class="grid grid-3">

        <!-- Headcount by Department -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">🏢 Dept. Headcount</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            @for (d of deptStats(); track d.dept) {
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="width:80px;font-size:0.78rem;color:var(--text-secondary);">{{ d.dept }}</span>
                <div class="att-bar-wrap"><div class="att-bar" style="background:linear-gradient(90deg,var(--primary),var(--primary-light));width:{{ d.pct }}%"></div></div>
                <span style="width:28px;text-align:right;font-size:0.8rem;font-weight:600;">{{ d.count }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Employee Status -->
        <div class="card">
          <div class="card-header"><span class="card-title">📊 Employee Status</span></div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            @for (s of empStatus(); track s.label) {
              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--bg-input);border-radius:var(--border-radius-sm);">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span>{{ s.icon }}</span>
                  <span style="font-size:0.82rem;color:var(--text-secondary);">{{ s.label }}</span>
                </div>
                <span class="badge" [class]="s.badge">{{ s.count }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Quick Links -->
        <div class="card">
          <div class="card-header"><span class="card-title">⚡ Quick Actions</span></div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <a class="hr-action-link" routerLink="/employees" id="hr-link-emp">👥 View All Employees</a>
            <a class="hr-action-link" routerLink="/attendance"  id="hr-link-att">🕐 Attendance Report</a>
            <a class="hr-action-link" routerLink="/leave/approvals"  id="hr-link-leave">🌴 Approve Leaves</a>
            <a class="hr-action-link" routerLink="/payroll/process"  id="hr-link-payroll">💰 Run Payroll</a>
            <a class="hr-action-link" routerLink="/payroll/slips"    id="hr-link-slips">🧾 Salary Slips</a>
            <a class="hr-action-link" routerLink="/admin/policies"   id="hr-link-policy">📜 Policies</a>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .att-bar-wrap { flex:1; height:7px; background:var(--bg-input); border-radius:99px; overflow:hidden; }
    .att-bar { height:100%; border-radius:99px; transition:width 1s ease; }
    .leave-req-item { display:flex; align-items:center; gap:10px; padding:10px 12px; background:var(--bg-input); border-radius:var(--border-radius-sm); }
    .emp-mini-avatar { width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg,var(--primary),var(--primary-dark)); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.72rem; color:#fff; flex-shrink:0; }
    .hr-action-link { display:flex; align-items:center; gap:10px; padding:11px 14px; border-radius:var(--border-radius-sm); background:var(--bg-input); color:var(--text-secondary); text-decoration:none; font-size:0.875rem; transition:all var(--transition); }
    .hr-action-link:hover { background:var(--primary-subtle); color:var(--primary-light); transform:translateX(4px); }
  `]
})
export class HrDashboardComponent implements OnInit {
  authState = inject(AuthStateService);
  private api = inject(ApiService);
  today = new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  stats = signal({
    totalEmployees: 0, presentToday: 0, absentToday: 0, onLeave: 0,
    lateArrivals: 0, earlyDepartures: 0, onTimeArrivals: 0,
    pendingLeaveApprovals: 0, monthlyPayroll: 0,
    newJoineesMonth: 0, exitingMonth: 0,
  });

  pendingLeaves = signal<any[]>([]);
  deptStats     = signal<any[]>([]);
  empStatus     = signal<any[]>([]);

  onTimePct  = () => this.pct(this.stats().onTimeArrivals);
  latePct    = () => this.pct(this.stats().lateArrivals);
  earlyPct   = () => this.pct(this.stats().earlyDepartures);
  absentPct  = () => this.pct(this.stats().absentToday);
  pct(n: number) { const t = this.stats().presentToday || 1; return Math.min(100, Math.round((n/t)*100)); }
  formatL(n: number) { return (n/100000).toFixed(1); }

  ngOnInit() { this.load(); }

  load() {
    this.api.post<any>('/v1/dashboard/hr-stats', {}).subscribe({
      next: (r: any) => { if (r && r.data) { this.stats.set(r.data.stats || {}); this.pendingLeaves.set(r.data.pendingLeaves ?? []); this.deptStats.set(r.data.deptStats ?? []); this.empStatus.set(r.data.empStatus ?? []); } },
      error: () => {
        this.stats.set({ totalEmployees: 0, presentToday: 0, absentToday: 0, onLeave: 0, lateArrivals: 0, earlyDepartures: 0, onTimeArrivals: 0, pendingLeaveApprovals: 0, monthlyPayroll: 0, newJoineesMonth: 0, exitingMonth: 0 });
        this.pendingLeaves.set([]);
        this.deptStats.set([]);
        this.empStatus.set([]);
      }
    });
  }
}
