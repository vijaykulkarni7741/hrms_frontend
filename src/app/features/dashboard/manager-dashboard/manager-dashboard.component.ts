import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { AuthStateService } from 'src/app/core/state/auth-state.service';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">

      <div class="page-header">
        <div>
          <h2 class="page-title">👔 Manager Dashboard</h2>
          <p class="page-subtitle">{{ authState.fullName() }} · {{ authState.user()?.departmentName }} · {{ today }}</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <span class="badge badge-success">● {{ stats().teamSize }} Team Members</span>
        </div>
      </div>

      <!-- Team KPIs -->
      <div class="grid grid-4" style="margin-bottom:20px;">
        <div class="stat-card" routerLink="/attendance">
          <div class="stat-icon" style="background:var(--success-subtle);">✅</div>
          <div class="stat-info">
            <div class="stat-value" style="color:var(--success);">{{ stats().teamPresent }}</div>
            <div class="stat-label">Team Present</div>
          </div>
        </div>
        <div class="stat-card" routerLink="/attendance">
          <div class="stat-icon" style="background:var(--danger-subtle);">🔴</div>
          <div class="stat-info">
            <div class="stat-value" style="color:var(--danger);">{{ stats().teamAbsent }}</div>
            <div class="stat-label">Team Absent</div>
          </div>
        </div>
        <div class="stat-card" routerLink="/leave/approvals">
          <div class="stat-icon" style="background:var(--warning-subtle);">📋</div>
          <div class="stat-info">
            <div class="stat-value" style="color:var(--warning);">{{ stats().pendingLeaves }}</div>
            <div class="stat-label">Leave Requests</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--warning-subtle);">⏰</div>
          <div class="stat-info">
            <div class="stat-value" style="color:var(--warning);">{{ stats().lateToday }}</div>
            <div class="stat-label">Late Today</div>
          </div>
        </div>
      </div>

      <div class="grid grid-2" style="margin-bottom:24px;">

        <!-- Team Attendance Today -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">👥 Team Attendance Today</span>
            <a class="btn btn-secondary btn-sm" routerLink="/attendance">Full Report</a>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            @for (m of teamMembers(); track m.id) {
              <div class="team-member-row">
                <div class="tm-avatar">{{ m.initials }}</div>
                <div style="flex:1;">
                  <div style="font-weight:600;font-size:0.85rem;">{{ m.name }}</div>
                  <div style="font-size:0.75rem;color:var(--text-muted);">{{ m.designation }}</div>
                </div>
                <div style="text-align:right;">
                  <span class="badge" [class]="attBadge(m.status)">{{ m.status }}</span>
                  @if (m.inTime) {
                    <div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px;">In: {{ m.inTime }}</div>
                  }
                  @if (m.isLate) {
                    <div style="font-size:0.7rem;color:var(--warning);">⏰ Late</div>
                  }
                  @if (m.isEarlyDep) {
                    <div style="font-size:0.7rem;color:var(--info);">🏃 Early Out</div>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Leave Requests Needing Approval -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">🌴 Leave Requests</span>
            <a class="btn btn-primary btn-sm" routerLink="/leave/approvals" id="mgr-approve-btn">Review All</a>
          </div>
          @if (leaveRequests().length === 0) {
            <div class="empty-state" style="padding:30px;">
              <div class="empty-icon" style="font-size:2rem;">✅</div>
              <h3 style="font-size:0.9rem;">No pending leave requests</h3>
            </div>
          } @else {
            <div style="display:flex;flex-direction:column;gap:8px;">
              @for (l of leaveRequests(); track l.id) {
                <div class="leave-card">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                    <div>
                      <div style="font-weight:600;font-size:0.875rem;">{{ l.empName }}</div>
                      <div style="font-size:0.78rem;color:var(--text-muted);">{{ l.leaveType }}</div>
                    </div>
                    <span class="badge badge-warning">Pending</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">
                    <div style="font-size:0.8rem;color:var(--text-secondary);">
                      📅 {{ l.from }} → {{ l.to }} · <strong>{{ l.days }} day(s)</strong>
                    </div>
                    <div style="display:flex;gap:6px;">
                      <a class="btn btn-success btn-sm" routerLink="/leave/approvals" [id]="'approve-'+l.id">✅ Approve</a>
                      <a class="btn btn-danger btn-sm"  routerLink="/leave/approvals" [id]="'reject-'+l.id">❌ Reject</a>
                    </div>
                  </div>
                  @if (l.reason) {
                    <div style="font-size:0.77rem;color:var(--text-muted);margin-top:6px;font-style:italic;">
                      "{{ l.reason }}"
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Bottom Row -->
      <div class="grid grid-3">

        <!-- Who's on Leave This Week -->
        <div class="card">
          <div class="card-header"><span class="card-title">📅 On Leave This Week</span></div>
          @if (onLeaveThisWeek().length === 0) {
            <div class="empty-state" style="padding:24px;"><h3>No one on leave</h3></div>
          } @else {
            <div style="display:flex;flex-direction:column;gap:8px;">
              @for (l of onLeaveThisWeek(); track l.id) {
                <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg-input);border-radius:var(--border-radius-sm);">
                  <div class="tm-avatar">{{ l.initials }}</div>
                  <div style="flex:1;">
                    <div style="font-weight:600;font-size:0.83rem;">{{ l.name }}</div>
                    <div style="font-size:0.73rem;color:var(--text-muted);">{{ l.from }} – {{ l.to }}</div>
                  </div>
                  <span class="badge badge-warning">{{ l.leaveType }}</span>
                </div>
              }
            </div>
          }
        </div>

        <!-- Early Check-in / Check-out Report -->
        <div class="card">
          <div class="card-header"><span class="card-title">⏱️ Check-in Summary</span></div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div class="checkin-stat-row">
              <span>🌅 Earliest In</span>
              <span style="font-weight:700;color:var(--success);">{{ stats().earliestIn }}</span>
            </div>
            <div class="checkin-stat-row">
              <span>🌙 Latest In</span>
              <span style="font-weight:700;color:var(--danger);">{{ stats().latestIn }}</span>
            </div>
            <div class="checkin-stat-row">
              <span>🏃 Early Departures</span>
              <span style="font-weight:700;color:var(--warning);">{{ stats().earlyDepartures }}</span>
            </div>
            <div class="checkin-stat-row">
              <span>⏰ Overtime Today</span>
              <span style="font-weight:700;color:var(--info);">{{ stats().overtimeCount }}</span>
            </div>
            <div class="divider"></div>
            <div class="checkin-stat-row">
              <span>📊 Avg Hours/Day</span>
              <span style="font-weight:700;color:var(--primary-light);">{{ stats().avgHours }} hrs</span>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="card">
          <div class="card-header"><span class="card-title">⚡ Quick Actions</span></div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <a class="hr-action-link" routerLink="/leave/approvals"  id="mgr-ql-leaves">🌴 Approve Leaves</a>
            <a class="hr-action-link" routerLink="/attendance"       id="mgr-ql-att">🕐 Attendance Log</a>
            <a class="hr-action-link" routerLink="/travel/approvals" id="mgr-ql-travel">✈️ Travel Approvals</a>
            <a class="hr-action-link" routerLink="/workflows/approvals" id="mgr-ql-wf">🔀 Workflow Approvals</a>
            <a class="hr-action-link" routerLink="/notifications"    id="mgr-ql-notif">🔔 Notifications</a>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .team-member-row { display:flex; align-items:center; gap:10px; padding:10px 12px; background:var(--bg-input); border-radius:var(--border-radius-sm); transition:all var(--transition); }
    .team-member-row:hover { background:var(--primary-subtle); }
    .tm-avatar { width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg,var(--primary),var(--primary-dark)); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.75rem; color:#fff; flex-shrink:0; }
    .leave-card { background:var(--bg-input); border:1px solid var(--border); border-radius:var(--border-radius-sm); padding:14px; transition:border-color var(--transition); }
    .leave-card:hover { border-color:var(--primary); }
    .checkin-stat-row { display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:var(--bg-input); border-radius:var(--border-radius-sm); font-size:0.82rem; color:var(--text-secondary); }
    .hr-action-link { display:flex; align-items:center; gap:10px; padding:11px 14px; border-radius:var(--border-radius-sm); background:var(--bg-input); color:var(--text-secondary); text-decoration:none; font-size:0.875rem; transition:all var(--transition); }
    .hr-action-link:hover { background:var(--primary-subtle); color:var(--primary-light); transform:translateX(4px); }
  `]
})
export class ManagerDashboardComponent implements OnInit {
  authState = inject(AuthStateService);
  private api = inject(ApiService);
  today = new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  stats = signal({
    teamSize: 0, teamPresent: 0, teamAbsent: 0, pendingLeaves: 0,
    lateToday: 0, earlyDepartures: 0, overtimeCount: 0, avgHours: 0,
    earliestIn: '—', latestIn: '—',
  });
  teamMembers    = signal<any[]>([]);
  leaveRequests  = signal<any[]>([]);
  onLeaveThisWeek = signal<any[]>([]);

  ngOnInit() { this.load(); }
  load() {
    this.api.post<any>('/v1/dashboard/manager-stats', {}).subscribe({
      next: (r: any) => { if (r && r.data) { this.stats.set(r.data.stats || {}); this.teamMembers.set(r.data.team ?? []); this.leaveRequests.set(r.data.pendingLeaves ?? []); } },
      error: () => {
        this.stats.set({ teamSize: 0, teamPresent: 0, teamAbsent: 0, pendingLeaves: 0, lateToday: 0, earlyDepartures: 0, overtimeCount: 0, avgHours: 0, earliestIn: '—', latestIn: '—' });
        this.teamMembers.set([]);
        this.leaveRequests.set([]);
        this.onLeaveThisWeek.set([]);
      }
    });
  }
  attBadge(s: string) {
    const m: Record<string,string> = { PRESENT:'badge-success', ABSENT:'badge-danger', LEAVE:'badge-warning', HALF_DAY:'badge-info' };
    return m[s] ?? 'badge-info';
  }
}
