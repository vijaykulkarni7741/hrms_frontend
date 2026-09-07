import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { AuthStateService } from 'src/app/core/state/auth-state.service';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">

      <!-- Welcome Header -->
      <div class="emp-welcome-card">
        <div class="welcome-left">
          <div class="welcome-avatar">{{ initials() }}</div>
          <div class="welcome-info">
            <h2>Good {{ greeting() }}, {{ authState.user()?.firstName }}! 👋</h2>
            <p>{{ authState.user()?.designationName }} · {{ authState.user()?.departmentName }} · {{ authState.user()?.workLocation }}</p>
            <p style="font-size:0.8rem;margin-top:2px;color:rgba(255,255,255,0.7);">{{ today }}</p>
          </div>
        </div>
        <div class="welcome-right">
          <div class="welcome-stat"><div class="ws-val">{{ stats().leaveBalance }}</div><div class="ws-label">Leave Balance</div></div>
          <div class="welcome-stat"><div class="ws-val">{{ stats().attendedDays }}</div><div class="ws-label">Days Attended</div></div>
          <div class="welcome-stat"><div class="ws-val">{{ stats().payslipsCount }}</div><div class="ws-label">Payslips</div></div>
        </div>
      </div>

      <!-- Today's Status -->
      <div class="grid grid-4" style="margin:24px 0;">
        <div class="stat-card">
          <div class="stat-icon" [style.background]="todayStatusBg()">{{ todayStatusIcon() }}</div>
          <div class="stat-info">
            <div class="stat-value" style="font-size:1.1rem;">{{ stats().todayStatus }}</div>
            <div class="stat-label">Today's Status</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--success-subtle);">🕗</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats().checkInTime || '—' }}</div>
            <div class="stat-label">Check In</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--danger-subtle);">🕔</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats().checkOutTime || '—' }}</div>
            <div class="stat-label">Check Out</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--info-subtle);">⏱️</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats().hoursWorked || '0' }} hrs</div>
            <div class="stat-label">Hours Worked</div>
          </div>
        </div>
      </div>

      <div class="grid grid-2" style="margin-bottom:24px;">

        <!-- My Leave Balance -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">🌴 My Leave Balance</span>
            <a class="btn btn-primary btn-sm" routerLink="/leave/my" id="emp-apply-leave-btn">Apply Leave</a>
          </div>
          <div style="display:flex;flex-direction:column;gap:12px;">
            @for (l of leaveBalances(); track l.type) {
              <div style="display:flex;align-items:center;gap:12px;">
                <span style="font-size:1.1rem;">{{ l.icon }}</span>
                <div style="flex:1;">
                  <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
                    <span style="font-size:0.82rem;color:var(--text-secondary);">{{ l.type }}</span>
                    <span style="font-size:0.82rem;font-weight:700;">{{ l.remaining }}/{{ l.total }}</span>
                  </div>
                  <div class="att-bar-wrap">
                    <div class="att-bar" [style.background]="l.color" [style.width]="(l.remaining/l.total*100)+'%'"></div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- My Recent Leave Applications -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">📋 My Leave Applications</span>
            <a class="btn btn-secondary btn-sm" routerLink="/leave/my">View All</a>
          </div>
          @if (myLeaves().length === 0) {
            <div class="empty-state" style="padding:28px;"><div class="empty-icon" style="font-size:2rem;">🌴</div><h3>No leave applications</h3></div>
          } @else {
            <div style="display:flex;flex-direction:column;gap:8px;">
              @for (l of myLeaves(); track l.id) {
                <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg-input);border-radius:var(--border-radius-sm);">
                  <span style="font-size:1.1rem;">{{ l.icon }}</span>
                  <div style="flex:1;">
                    <div style="font-weight:600;font-size:0.83rem;">{{ l.leaveType }}</div>
                    <div style="font-size:0.73rem;color:var(--text-muted);">{{ l.from }} → {{ l.to }} · {{ l.days }} day(s)</div>
                    @if (l.remarks) { <div style="font-size:0.7rem;color:var(--danger);margin-top:2px;">Remarks: {{ l.remarks }}</div> }
                  </div>
                  <span class="badge" [class]="leaveBadge(l.status)">{{ l.status }}</span>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Bottom Row -->
      <div class="grid grid-3">

        <!-- Upcoming Holidays -->
        <div class="card">
          <div class="card-header"><span class="card-title">🎉 Upcoming Holidays</span></div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            @for (h of holidays(); track h.date) {
              <div style="display:flex;align-items:center;gap:12px;padding:10px;background:var(--bg-input);border-radius:var(--border-radius-sm);">
                <div style="text-align:center;min-width:40px;">
                  <div style="font-size:1.1rem;font-weight:700;color:var(--primary-light);">{{ h.day }}</div>
                  <div style="font-size:0.7rem;color:var(--text-muted);">{{ h.month }}</div>
                </div>
                <div>
                  <div style="font-weight:600;font-size:0.83rem;">{{ h.name }}</div>
                  <div style="font-size:0.73rem;color:var(--text-muted);">{{ h.type }}</div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- My Attendance Summary -->
        <div class="card">
          <div class="card-header"><span class="card-title">📊 This Month's Summary</span></div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div class="emp-stat-row"><span>✅ Days Present</span><strong>{{ stats().presentDays }}</strong></div>
            <div class="emp-stat-row"><span>🔴 Days Absent</span><strong>{{ stats().absentDays }}</strong></div>
            <div class="emp-stat-row"><span>🌴 Leave Taken</span><strong>{{ stats().leaveTaken }}</strong></div>
            <div class="emp-stat-row"><span>⏰ Late Arrivals</span><strong style="color:var(--warning);">{{ stats().lateDays }}</strong></div>
            <div class="emp-stat-row"><span>🏃 Early Depart.</span><strong style="color:var(--info);">{{ stats().earlyDepartureDays }}</strong></div>
            <div class="divider"></div>
            <div class="emp-stat-row"><span>💰 Last Payslip</span><strong style="color:var(--success);">₹{{ formatAmt(stats().lastSalary) }}</strong></div>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="card">
          <div class="card-header"><span class="card-title">⚡ Quick Actions</span></div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <a class="hr-action-link" routerLink="/leave/my"       id="emp-ql-leave">🌴 Apply Leave</a>
            <a class="hr-action-link" routerLink="/attendance"     id="emp-ql-att">🕐 My Attendance</a>
            <a class="hr-action-link" routerLink="/payroll/slips"  id="emp-ql-slip">🧾 My Payslips</a>
            <a class="hr-action-link" routerLink="/travel"         id="emp-ql-travel">✈️ Travel Request</a>
            <a class="hr-action-link" routerLink="/notifications"  id="emp-ql-notif">🔔 Notifications</a>
            <a class="hr-action-link" routerLink="/profile"        id="emp-ql-profile">👤 My Profile</a>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .emp-welcome-card {
      background: linear-gradient(135deg, var(--primary-dark), var(--primary));
      border-radius: var(--border-radius-lg); padding: 28px 32px;
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 20px; margin-bottom: 8px;
      box-shadow: var(--shadow-glow);
    }
    .welcome-left  { display:flex; align-items:center; gap:16px; }
    .welcome-avatar { width:60px; height:60px; border-radius:50%; background:rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.4rem; color:#fff; border:3px solid rgba(255,255,255,0.3); }
    .welcome-info h2 { color:#fff; font-size:1.3rem; font-weight:700; margin:0; }
    .welcome-info p  { color:rgba(255,255,255,0.8); font-size:0.875rem; margin:4px 0 0; }
    .welcome-right { display:flex; gap:28px; }
    .welcome-stat { text-align:center; }
    .ws-val   { font-size:1.8rem; font-weight:800; color:#fff; line-height:1; }
    .ws-label { font-size:0.72rem; color:rgba(255,255,255,0.7); margin-top:4px; }

    .att-bar-wrap { flex:1; height:6px; background:rgba(255,255,255,0.1); border-radius:99px; overflow:hidden; }
    .att-bar { height:100%; border-radius:99px; transition:width 1s ease; }

    .emp-stat-row { display:flex; justify-content:space-between; align-items:center; padding:9px 12px; background:var(--bg-input); border-radius:var(--border-radius-sm); font-size:0.82rem; color:var(--text-secondary); }
    .hr-action-link { display:flex; align-items:center; gap:10px; padding:11px 14px; border-radius:var(--border-radius-sm); background:var(--bg-input); color:var(--text-secondary); text-decoration:none; font-size:0.875rem; transition:all var(--transition); }
    .hr-action-link:hover { background:var(--primary-subtle); color:var(--primary-light); transform:translateX(4px); }

    @media (max-width:768px) {
      .emp-welcome-card { flex-direction:column; }
      .welcome-right { justify-content:center; }
    }
  `]
})
export class EmployeeDashboardComponent implements OnInit {
  authState = inject(AuthStateService);
  private api = inject(ApiService);
  today = new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  stats = signal({
    todayStatus: '—', checkInTime: '', checkOutTime: '', hoursWorked: 0,
    leaveBalance: 0, attendedDays: 0, payslipsCount: 0,
    presentDays: 0, absentDays: 0, leaveTaken: 0, lateDays: 0, earlyDepartureDays: 0, lastSalary: 0,
  });
  leaveBalances = signal<any[]>([]);
  myLeaves      = signal<any[]>([]);
  holidays      = signal<any[]>([]);

  initials = () => {
    const u = this.authState.user();
    return `${u?.firstName?.[0]??''}${u?.lastName?.[0]??''}`.toUpperCase();
  };
  greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Morning'; if (h < 17) return 'Afternoon'; return 'Evening';
  }
  todayStatusIcon() {
    const m: Record<string,string> = { PRESENT:'✅', ABSENT:'🔴', LEAVE:'🌴', HALF_DAY:'🟡' };
    return m[this.stats().todayStatus] ?? '⬜';
  }
  todayStatusBg() {
    const m: Record<string,string> = { PRESENT:'var(--success-subtle)', ABSENT:'var(--danger-subtle)', LEAVE:'var(--warning-subtle)' };
    return m[this.stats().todayStatus] ?? 'var(--bg-input)';
  }
  formatAmt(n: number) { return n.toLocaleString('en-IN'); }
  leaveBadge(s: string) {
    const m: Record<string,string> = { PENDING:'badge-warning', APPROVED:'badge-success', REJECTED:'badge-danger' };
    return m[s] ?? 'badge-info';
  }

  ngOnInit() { this.load(); }
  load() {
    this.api.post<any>('/v1/dashboard/employee-stats', {}).subscribe({
      next: (r: any) => { if (r && r.data) { this.stats.set(r.data.stats || {}); this.leaveBalances.set(r.data.leaveBalances??[]); this.myLeaves.set(r.data.myLeaves??[]); this.holidays.set(r.data.holidays??[]); }},
      error: () => {
        this.stats.set({ todayStatus: '—', checkInTime: '', checkOutTime: '', hoursWorked: 0, leaveBalance: 0, attendedDays: 0, payslipsCount: 0, presentDays: 0, absentDays: 0, leaveTaken: 0, lateDays: 0, earlyDepartureDays: 0, lastSalary: 0 });
        this.leaveBalances.set([]);
        this.myLeaves.set([]);
        this.holidays.set([]);
      }
    });
  }
}
