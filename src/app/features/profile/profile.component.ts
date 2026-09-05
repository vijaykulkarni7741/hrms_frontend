import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthStateService } from '../../core/state/auth-state.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div><h2 class="page-title">👤 My Profile</h2><p class="page-subtitle">View and update your profile</p></div>
      </div>

      <div class="grid grid-2" style="gap:24px;">
        <!-- Profile Card -->
        <div class="card" style="text-align:center;">
          <div class="profile-avatar">{{ initials() }}</div>
          <h3 style="margin-top:16px;">{{ authState.fullName() }}</h3>
          <p style="font-size:0.85rem;color:var(--primary-light);font-weight:500;">{{ u?.designationName }}</p>
          <p style="font-size:0.82rem;color:var(--text-muted);">{{ u?.departmentName }} · {{ u?.organizationName }}</p>
          <div style="margin-top:20px;display:flex;flex-direction:column;gap:10px;">
            <div class="profile-info-row"><span>📧</span><span>{{ u?.officialEmail || u?.email }}</span></div>
            <div class="profile-info-row"><span>📱</span><span>{{ u?.mobileNumber || '—' }}</span></div>
            <div class="profile-info-row"><span>🆔</span><span>{{ u?.employeeCode }}</span></div>
            <div class="profile-info-row"><span>🏢</span><span>{{ u?.workLocation || '—' }}</span></div>
            <div class="profile-info-row"><span>👔</span><span>{{ u?.roleName }}</span></div>
            <div class="profile-info-row"><span>📊</span><span>{{ u?.employeeType }}</span></div>
          </div>
        </div>

        <!-- Change Password -->
        <div class="card">
          <div class="card-header"><span class="card-title">🔐 Change Password</span></div>
          <div class="form-group">
            <label class="form-label">Current Password</label>
            <input type="password" class="form-control" [(ngModel)]="pwdForm.currentPassword" id="curr-pwd" placeholder="Enter current password" />
          </div>
          <div class="form-group">
            <label class="form-label">New Password</label>
            <input type="password" class="form-control" [(ngModel)]="pwdForm.newPassword" id="new-pwd" placeholder="Min. 8 characters" />
          </div>
          <div class="form-group">
            <label class="form-label">Confirm New Password</label>
            <input type="password" class="form-control" [(ngModel)]="pwdForm.confirmPassword" id="confirm-pwd" placeholder="Repeat new password" />
          </div>
          <button class="btn btn-primary w-100" (click)="changePassword()" [disabled]="submitting()" id="change-pwd-btn">
            @if (submitting()) { <div class="spinner"></div> } Update Password
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-avatar { width:80px; height:80px; border-radius:50%; background:linear-gradient(135deg,var(--primary),var(--primary-dark)); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:2rem; color:#fff; margin:0 auto; box-shadow:var(--shadow-glow); }
    .profile-info-row { display:flex; align-items:center; gap:10px; padding:9px 14px; background:var(--bg-input); border-radius:var(--border-radius-sm); font-size:0.83rem; color:var(--text-secondary); }
    .profile-info-row span:last-child { color:var(--text-primary); font-weight:500; }
  `]
})
export class ProfileComponent implements OnInit {
  authState = inject(AuthStateService);
  private api   = inject(ApiService);
  private toast = inject(ToastService);
  submitting = signal(false);
  pwdForm = { currentPassword:'', newPassword:'', confirmPassword:'' };
  get u() { return this.authState.user(); }
  initials() { return `${this.u?.firstName?.[0]??''}${this.u?.lastName?.[0]??''}`.toUpperCase(); }
  ngOnInit() {}
  changePassword() {
    if (!this.pwdForm.currentPassword || !this.pwdForm.newPassword) { this.toast.warning('All fields are required.'); return; }
    if (this.pwdForm.newPassword !== this.pwdForm.confirmPassword) { this.toast.error('Passwords do not match.'); return; }
    if (this.pwdForm.newPassword.length < 8) { this.toast.warning('Password must be at least 8 characters.'); return; }
    this.submitting.set(true);
    this.api.post('/v1/auth/change-password', { currentPassword: this.pwdForm.currentPassword, newPassword: this.pwdForm.newPassword }).subscribe({
      next: r => { this.toast.success('Password updated successfully!'); this.pwdForm = {currentPassword:'',newPassword:'',confirmPassword:''}; this.submitting.set(false); },
      error: () => this.submitting.set(false)
    });
  }
}
