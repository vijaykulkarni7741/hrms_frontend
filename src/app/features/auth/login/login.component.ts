import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthStateService } from '../../core/state/auth-state.service';
import { ToastService } from '../../core/services/toast.service';
import { ToastComponent } from '../../shared/toast/toast.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  template: `
    <div class="login-page">
      <app-toast></app-toast>

      <!-- Left decorative panel -->
      <div class="login-left">
        <div class="login-left-content">
          <div class="login-brand">
            <div class="brand-logo-lg">H</div>
            <h1>HRMS Portal</h1>
          </div>
          <p class="login-tagline">
            One platform to manage your entire workforce —
            attendance, leaves, payroll, workflows and more.
          </p>
          <div class="login-features">
            <div class="feature-item">✅ Role-Based Dashboards</div>
            <div class="feature-item">📊 Real-time Analytics</div>
            <div class="feature-item">💰 Automated Payroll</div>
            <div class="feature-item">🔔 Smart Notifications</div>
          </div>
        </div>
        <div class="login-orbs">
          <div class="orb orb-1"></div>
          <div class="orb orb-2"></div>
          <div class="orb orb-3"></div>
        </div>
      </div>

      <!-- Right form panel -->
      <div class="login-right">
        <div class="login-card">
          <div class="login-card-header">
            <h2>Welcome Back</h2>
            <p>Sign in with your Employee ID, Code, Email or Username</p>
          </div>

          <form class="login-form" (ngSubmit)="onLogin()" #loginForm="ngForm">

            <div class="form-group">
              <label class="form-label" for="identifier">Employee ID / Email / Code</label>
              <input
                id="identifier"
                type="text"
                class="form-control"
                placeholder="EMP001 or john@company.com"
                [(ngModel)]="cred.employeeIdentifier"
                name="identifier"
                required
                autocomplete="username"
                [disabled]="isLoading()"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="password">Password</label>
              <div class="password-wrapper">
                <input
                  id="password"
                  [type]="showPwd() ? 'text' : 'password'"
                  class="form-control"
                  placeholder="Enter your password"
                  [(ngModel)]="cred.password"
                  name="password"
                  required
                  autocomplete="current-password"
                  [disabled]="isLoading()"
                />
                <button type="button" class="pwd-toggle" (click)="showPwd.update(v => !v)" id="pwd-toggle-btn" tabindex="-1">
                  {{ showPwd() ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            @if (errorMsg()) {
              <div class="login-error">
                ⚠️ {{ errorMsg() }}
              </div>
            }

            <button
              type="submit"
              class="btn btn-primary w-100"
              id="login-submit-btn"
              style="margin-top:8px; padding:13px;"
              [disabled]="isLoading() || !cred.employeeIdentifier || !cred.password">
              @if (isLoading()) {
                <div class="spinner"></div>
                <span>{{ loadingMsg() }}</span>
              } @else {
                🔐 Sign In
              }
            </button>
          </form>

          <div class="login-footer">
            <p>Trouble logging in? Contact your HR Administrator.</p>
            <p style="margin-top:6px; font-size:0.72rem; color: var(--text-muted);">
              ⚡ Powered by HRMS Portal
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      background: var(--bg);
    }

    /* Left decorative panel */
    .login-left {
      flex: 1;
      background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 50%, #c040e0 100%);
      display: flex; align-items: center; justify-content: center;
      padding: 48px; position: relative; overflow: hidden;
    }
    .login-left-content { position: relative; z-index: 2; max-width: 440px; }
    .login-brand { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
    .brand-logo-lg {
      width: 60px; height: 60px;
      background: rgba(255,255,255,0.2); border-radius: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 2rem; color: #fff;
      backdrop-filter: blur(10px); box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }
    .login-brand h1 { font-size: 2.2rem; font-weight: 800; color: #fff; }
    .login-tagline { font-size: 1.05rem; color: rgba(255,255,255,0.85); line-height: 1.75; margin-bottom: 32px; }
    .login-features { display: flex; flex-direction: column; gap: 10px; }
    .feature-item {
      font-size: 0.9rem; color: rgba(255,255,255,0.92); font-weight: 500;
      background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.22);
      border-radius: var(--border-radius-sm); padding: 11px 18px;
      backdrop-filter: blur(8px); transition: all var(--transition);
    }
    .feature-item:hover { background: rgba(255,255,255,0.2); transform: translateX(4px); }

    /* Orbs */
    .orb { position: absolute; border-radius: 50%; filter: blur(70px); opacity: 0.3; }
    .orb-1 { width: 320px; height: 320px; background: #fff;             top: -100px; right: -80px; }
    .orb-2 { width: 220px; height: 220px; background: var(--primary-dark); bottom: 30px;  left: -70px; }
    .orb-3 { width: 160px; height: 160px; background: #c040e0;          bottom: 160px; right: 30px; }

    /* Right form panel */
    .login-right {
      width: 480px; min-width: 360px;
      display: flex; align-items: center; justify-content: center;
      padding: 48px 40px;
    }
    .login-card { width: 100%; }
    .login-card-header { margin-bottom: 36px; }
    .login-card-header h2 { font-size: 1.9rem; font-weight: 700; color: var(--text-primary); }
    .login-card-header p  { color: var(--text-secondary); margin-top: 8px; font-size: 0.9rem; }

    .login-form { display: flex; flex-direction: column; gap: 6px; }
    .password-wrapper { position: relative; }
    .password-wrapper .form-control { padding-right: 44px; }
    .pwd-toggle {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; font-size: 1.15rem; padding: 0;
    }

    .login-error {
      background: var(--danger-subtle); border: 1px solid var(--danger);
      border-radius: var(--border-radius-sm); padding: 10px 14px;
      font-size: 0.85rem; color: var(--danger); margin-top: 4px;
    }

    .login-footer { text-align: center; margin-top: 28px; font-size: 0.82rem; color: var(--text-muted); }

    @media (max-width: 768px) {
      .login-page { flex-direction: column; }
      .login-left  { display: none; }
      .login-right { width: 100%; min-width: unset; padding: 32px 24px; min-height: 100vh; }
    }
  `]
})
export class LoginComponent {

  private api       = inject(ApiService);
  private authState = inject(AuthStateService);
  private router    = inject(Router);
  private toast     = inject(ToastService);

  cred = { employeeIdentifier: '', password: '' };
  showPwd    = signal(false);
  isLoading  = signal(false);
  errorMsg   = signal('');
  loadingMsg = signal('Signing in…');

  onLogin(): void {
    this.errorMsg.set('');
    if (!this.cred.employeeIdentifier?.trim() || !this.cred.password?.trim()) {
      this.errorMsg.set('Please enter your Employee ID and password.');
      return;
    }

    this.isLoading.set(true);
    this.loadingMsg.set('Signing in…');

    // ── Step 1: Login → get token + sessionId ─────────────────
    this.api.post<{ token: string; sessionId: string; tokenType: string; expiresIn: number }>(
      '/v1/auth/login',
      { employeeIdentifier: this.cred.employeeIdentifier.trim(), password: this.cred.password }
    ).subscribe({
      next: (res) => {
        if (!res.success || !res.data?.token) {
          this.errorMsg.set(res.message || 'Login failed. Please try again.');
          this.isLoading.set(false);
          return;
        }

        const { token, sessionId } = res.data;

        // Store token and sessionId (NO sessionStorage — only localStorage via AuthStateService)
        this.authState.setToken(token, sessionId);
        this.loadingMsg.set('Loading your profile…');

        // ── Step 2: Fetch employee profile from Redis session ──
        this.api.post<any>('/v1/auth/session', {}).subscribe({
          next: (sessionRes) => {
            if (sessionRes.success && sessionRes.data) {
              const userData = sessionRes.data;
              this.authState.setUser({
                id:               userData.id,
                employeeCode:     userData.employeeCode,
                firstName:        userData.firstName,
                middleName:       userData.middleName,
                lastName:         userData.lastName,
                email:            userData.email,
                officialEmail:    userData.officialEmail,
                mobileNumber:     userData.mobileNumber,
                employeeType:     userData.employeeType,
                employmentStatus: userData.employmentStatus,
                organizationId:   userData.organizationId,
                organizationName: userData.organizationName,
                unitId:           userData.unitId,
                unitName:         userData.unitName,
                departmentId:     userData.departmentId,
                departmentName:   userData.departmentName,
                designationId:    userData.designationId,
                designationName:  userData.designationName,
                gradeId:          userData.gradeId,
                gradeName:        userData.gradeName,
                roleId:           userData.roleId,
                roleCode:         userData.roleCode,
                roleName:         userData.roleName,
                workLocation:     userData.workLocation,
                isActive:         userData.isActive,
                userId:           userData.userId,
                username:         userData.username,
                permissions:      userData.permissions ?? [],
              });

              const name = userData.firstName + ' ' + userData.lastName;
              this.toast.success(`Welcome back, ${name}! 👋`);
              this.isLoading.set(false);
              this.router.navigate(['/dashboard']);
            } else {
              // Token is valid but session fetch failed — still logged in, redirect with minimal info
              this.toast.warning('Profile load partial. Some features may be limited.');
              this.isLoading.set(false);
              this.router.navigate(['/dashboard']);
            }
          },
          error: () => {
            // Session fetch failed but token is valid — proceed anyway
            this.isLoading.set(false);
            this.router.navigate(['/dashboard']);
          }
        });
      },
      error: (err) => {
        const msg = err?.error?.message || 'Invalid credentials. Please try again.';
        this.errorMsg.set(msg);
        this.isLoading.set(false);
      }
    });
  }
}
