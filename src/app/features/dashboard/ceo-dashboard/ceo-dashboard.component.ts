import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthStateService } from '../../../core/state/auth-state.service';

@Component({
  selector: 'app-ceo-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">📊 Executive Dashboard</h2>
          <p class="page-subtitle">
            {{ authState.fullName() }} · {{ authState.roleName() }} · {{ today }}
          </p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <span class="badge badge-success" style="padding:7px 14px;">● Live</span>
          <span class="badge badge-primary" style="padding:7px 14px;">{{ authState.organizationName }}</span>
        </div>
      </div>

      <!-- Top KPI Row -->
      <div class="grid grid-4" style="margin-bottom:24px;">
        <div class="stat-card cursor-pointer" routerLink="/employees">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <div class="stat-value">{{ kpi().totalEmployees }}</div>
            <div class="stat-label">Total Headcount</div>
          </div>
        </div>
        <div class="stat-card cursor-pointer" routerLink="/attendance">
          <div class="stat-icon" style="background:var(--success-subtle);">✅</div>
          <div class="stat-info">
            <div class="stat-value" style="color:var(--success);">{{ kpi().presentToday }}</div>
            <div class="stat-label">Present Today</div>
          </div>
        </div>
        <div class="stat-card cursor-pointer" routerLink="/leave/my">
          <div class="stat-icon" style="background:var(--warning-subtle);">🌴</div>
          <div class="stat-info">
            <div class="stat-value" style="color:var(--warning);">{{ kpi().onLeave }}</div>
            <div class="stat-label">On Leave</div>
          </div>
        </div>
        <div class="stat-card cursor-pointer" routerLink="/workflows/approvals">
          <div class="stat-icon" style="background:var(--danger-subtle);">⏳</div>
          <div class="stat-info">
            <div class="stat-value" style="color:var(--danger);">{{ kpi().pendingApprovals }}</div>
            <div class="stat-label">Pending Approvals</div>
          </div>
        </div>
      </div>

      <!-- Payroll & Finance Row -->
      <div class="grid grid-4" style="margin-bottom:24px;">
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--success-subtle);">💰</div>
          <div class="stat-info">
            <div class="stat-value" style="color:var(--success);font-size:1.4rem;">₹{{ formatCr(kpi().monthlyPayroll) }}Cr</div>
            <div class="stat-label">Monthly Payroll</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--info-subtle);">📈</div>
          <div class="stat-info">
            <div class="stat-value" style="color:var(--info);">{{ kpi().attendancePct }}%</div>
            <div class="stat-label">Attendance Rate</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--warning-subtle);">🏢</div>
          <div class="stat-info">
            <div class="stat-value" style="color:var(--warning);">{{ kpi().totalDepartments }}</div>
            <div class="stat-label">Departments</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--danger-subtle);">🔄</div>
          <div class="stat-info">
            <div class="stat-value" style="color:var(--danger);">{{ kpi().attritionRate }}%</div>
            <div class="stat-label">Attrition Rate</div>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-2" style="margin-bottom:24px;">

        <!-- Attendance Breakdown -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">🕐 Today's Workforce Status</span>
          </div>
          <div class="donut-wrapper">
            <div class="donut-chart">
              <svg viewBox="0 0 100 100" class="donut-svg">
                <circle class="donut-bg" cx="50" cy="50" r="35" />
                <circle class="donut-seg present" cx="50" cy="50" r="35"
                  [attr.stroke-dasharray]="presentArc() + ' ' + (220 - presentArc())"
                  stroke-dashoffset="55" />
                <circle class="donut-seg leave" cx="50" cy="50" r="35"
                  [attr.stroke-dasharray]="leaveArc() + ' ' + (220 - leaveArc())"
                  [attr.stroke-dashoffset]="220 - presentArc() + 55" />
              </svg>
              <div class="donut-center">
                <div class="donut-value">{{ kpi().attendancePct }}%</div>
                <div class="donut-label">Present</div>
              </div>
            </div>
            <div class="donut-legend">
              <div class="legend-item"><span class="dot" style="background:var(--success);"></span>Present <strong>{{ kpi().presentToday }}</strong></div>
              <div class="legend-item"><span class="dot" style="background:var(--warning);"></span>On Leave <strong>{{ kpi().onLeave }}</strong></div>
              <div class="legend-item"><span class="dot" style="background:var(--danger);"></span>Absent <strong>{{ kpi().absent }}</strong></div>
              <div class="legend-item"><span class="dot" style="background:var(--info);"></span>Remote <strong>{{ kpi().remote }}</strong></div>
            </div>
          </div>
        </div>

        <!-- Dept Headcount -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">🏢 Department Headcount</span>
          </div>
          <div class="dept-bars">
            @for (d of deptStats(); track d.name) {
              <div class="dept-bar-row">
                <span class="dept-name">{{ d.name }}</span>
                <div class="dept-bar-track">
                  <div class="dept-bar-fill" [style.width]="d.pct + '%'"></div>
                </div>
                <span class="dept-count">{{ d.count }}</span>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Bottom Row -->
      <div class="grid grid-3">

        <!-- Leave Trend -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">📋 Leave Summary (Month)</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:12px;">
            @for (l of leaveTypes(); track l.name) {
              <div style="display:flex;align-items:center;gap:12px;">
                <span style="font-size:1.1rem;">{{ l.icon }}</span>
                <div style="flex:1;">
                  <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                    <span style="font-size:0.82rem;color:var(--text-secondary);">{{ l.name }}</span>
                    <span style="font-size:0.82rem;font-weight:600;">{{ l.count }}</span>
                  </div>
                  <div class="att-bar-wrap"><div class="att-bar" [style.background]="l.color" [style.width]="(l.count/20*100)+'%'"></div></div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Pending Approvals -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">⏳ Pending Approvals</span>
            <a class="btn btn-secondary btn-sm" routerLink="/workflows/approvals">View All</a>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div class="approval-item"><span class="appr-icon">🌴</span><div class="appr-info"><div class="appr-label">Leave Requests</div><div class="appr-count">{{ kpi().pendingLeaves }}</div></div><span class="badge badge-warning">Pending</span></div>
            <div class="approval-item"><span class="appr-icon">✈️</span><div class="appr-info"><div class="appr-label">Travel Requests</div><div class="appr-count">{{ kpi().pendingTravel }}</div></div><span class="badge badge-warning">Pending</span></div>
            <div class="approval-item"><span class="appr-icon">💰</span><div class="appr-info"><div class="appr-label">Expense Claims</div><div class="appr-count">{{ kpi().pendingExpenses }}</div></div><span class="badge badge-warning">Pending</span></div>
            <div class="approval-item"><span class="appr-icon">🔀</span><div class="appr-info"><div class="appr-label">Workflows</div><div class="appr-count">{{ kpi().pendingWorkflows }}</div></div><span class="badge badge-warning">Pending</span></div>
          </div>
        </div>

        <!-- Recent Joins / Exits -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">👤 People Movement</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div style="font-size:0.78rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;">This Month</div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--success-subtle);border-radius:var(--border-radius-sm);">
              <div><div style="font-weight:600;color:var(--success);">{{ kpi().newJoinees }}</div><div style="font-size:0.78rem;color:var(--text-muted);">New Joinees</div></div>
              <span style="font-size:1.5rem;">➕</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--danger-subtle);border-radius:var(--border-radius-sm);">
              <div><div style="font-weight:600;color:var(--danger);">{{ kpi().exits }}</div><div style="font-size:0.78rem;color:var(--text-muted);">Exits</div></div>
              <span style="font-size:1.5rem;">🚪</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--info-subtle);border-radius:var(--border-radius-sm);">
              <div><div style="font-weight:600;color:var(--info);">{{ kpi().onProbation }}</div><div style="font-size:0.78rem;color:var(--text-muted);">On Probation</div></div>
              <span style="font-size:1.5rem;">⏱️</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .att-bar-wrap { flex:1; height:6px; background:var(--bg-input); border-radius:99px; overflow:hidden; }
    .att-bar { height:100%; border-radius:99px; transition: width 1s ease; }

    .donut-wrapper { display:flex; align-items:center; gap:24px; }
    .donut-chart { position:relative; width:140px; height:140px; flex-shrink:0; }
    .donut-svg { width:100%; height:100%; transform:rotate(-90deg); }
    .donut-bg  { fill:none; stroke:var(--border); stroke-width:12; }
    .donut-seg { fill:none; stroke-width:12; transition:stroke-dasharray 1s ease; }
    .donut-seg.present { stroke:var(--success); }
    .donut-seg.leave   { stroke:var(--warning); }
    .donut-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
    .donut-value { font-size:1.4rem; font-weight:700; color:var(--text-primary); }
    .donut-label { font-size:0.7rem; color:var(--text-muted); }
    .donut-legend { display:flex; flex-direction:column; gap:10px; }
    .legend-item { display:flex; align-items:center; gap:8px; font-size:0.82rem; color:var(--text-secondary); }
    .dot { width:10px; height:10px; border-radius:50%; display:inline-block; flex-shrink:0; }
    .legend-item strong { margin-left:auto; color:var(--text-primary); }

    .dept-bars { display:flex; flex-direction:column; gap:12px; }
    .dept-bar-row { display:flex; align-items:center; gap:10px; }
    .dept-name { width:90px; font-size:0.78rem; color:var(--text-secondary); flex-shrink:0; truncate:true; }
    .dept-bar-track { flex:1; height:8px; background:var(--bg-input); border-radius:99px; overflow:hidden; }
    .dept-bar-fill { height:100%; background:linear-gradient(90deg, var(--primary), var(--primary-light)); border-radius:99px; transition: width 1s ease; }
    .dept-count { width:30px; text-align:right; font-size:0.8rem; font-weight:600; }

    .approval-item { display:flex; align-items:center; gap:12px; padding:10px 12px; background:var(--bg-input); border-radius:var(--border-radius-sm); }
    .appr-icon { font-size:1.2rem; }
    .appr-info { flex:1; }
    .appr-label { font-size:0.8rem; color:var(--text-secondary); }
    .appr-count { font-size:1rem; font-weight:700; color:var(--text-primary); }
  `]
})
export class CeoDashboardComponent implements OnInit {
  authState = inject(AuthStateService);
  private api = inject(ApiService);

  today = new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  kpi = signal({
    totalEmployees: 0, presentToday: 0, onLeave: 0, absent: 0, remote: 0,
    pendingApprovals: 0, pendingLeaves: 0, pendingTravel: 0, pendingExpenses: 0, pendingWorkflows: 0,
    monthlyPayroll: 0, attendancePct: 0, totalDepartments: 0, attritionRate: 0,
    newJoinees: 0, exits: 0, onProbation: 0,
  });

  deptStats = signal([
    { name:'Engineering', count: 42, pct: 85 },
    { name:'Sales',       count: 28, pct: 56 },
    { name:'HR',          count: 12, pct: 24 },
    { name:'Finance',     count: 18, pct: 36 },
    { name:'Operations',  count: 22, pct: 44 },
  ]);

  leaveTypes = signal([
    { name:'Casual Leave',   count: 14, icon:'🌴', color:'var(--success)' },
    { name:'Sick Leave',     count:  9, icon:'🏥', color:'var(--danger)'  },
    { name:'Earned Leave',   count:  6, icon:'✈️', color:'var(--info)'    },
    { name:'Comp Off',       count:  4, icon:'🔄', color:'var(--warning)' },
    { name:'Maternity/Pat.', count:  2, icon:'👶', color:'var(--primary)' },
  ]);

  get organizationName() { return this.authState.user()?.organizationName ?? ''; }

  presentArc = () => {
    const pct = this.kpi().attendancePct / 100;
    return Math.round(pct * 220);
  };
  leaveArc = () => {
    const t = this.kpi().totalEmployees;
    if (!t) return 0;
    return Math.round((this.kpi().onLeave / t) * 220);
  };
  formatCr = (n: number) => (n / 10000000).toFixed(2);

  ngOnInit() { this.loadKpis(); }

  loadKpis() {
    this.api.post<any>('/v1/dashboard/ceo-stats', {}).subscribe({
      next: r => {
        if (r.success) this.kpi.set(r.data);
      },
      error: () => {
        // Fallback demo data
        this.kpi.set({
          totalEmployees: 142, presentToday: 118, onLeave: 12, absent: 8, remote: 4,
          pendingApprovals: 19, pendingLeaves: 7, pendingTravel: 5, pendingExpenses: 4, pendingWorkflows: 3,
          monthlyPayroll: 24500000, attendancePct: 83, totalDepartments: 8, attritionRate: 4.2,
          newJoinees: 6, exits: 2, onProbation: 9,
        });
        this.deptStats.set([
          { name:'Engineering', count: 42, pct: 85 },
          { name:'Sales',       count: 28, pct: 56 },
          { name:'HR',          count: 12, pct: 24 },
          { name:'Finance',     count: 18, pct: 36 },
          { name:'Operations',  count: 22, pct: 44 },
          { name:'Support',     count: 20, pct: 40 },
        ]);
      }
    });
  }
}
