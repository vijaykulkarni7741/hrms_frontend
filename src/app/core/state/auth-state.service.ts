import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface User {
  id: number;
  employeeCode: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  officialEmail?: string;
  mobileNumber?: string;
  employeeType?: string;
  employmentStatus?: string;
  organizationId?: number;
  organizationName?: string;
  unitId?: number;
  unitName?: string;
  departmentId?: number;
  departmentName?: string;
  designationId?: number;
  designationName?: string;
  gradeId?: number;
  gradeName?: string;
  roleId?: number;
  roleCode?: string;
  roleName?: string;
  workLocation?: string;
  isActive?: boolean;
  userId?: number;
  username?: string;
  permissions?: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthStateService {

  // ── Signals ────────────────────────────────────────────────
  private _user      = signal<User | null>(null);
  private _token     = signal<string | null>(null);
  private _sessionId = signal<string | null>(null);
  private _isLoading = signal<boolean>(false);

  // ── Readable Signals ───────────────────────────────────────
  readonly user          = this._user.asReadonly();
  readonly token         = this._token.asReadonly();
  readonly sessionId     = this._sessionId.asReadonly();
  readonly isLoading     = this._isLoading.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token() && !!this._user());

  readonly roleName    = computed(() => this._user()?.roleName ?? '');
  readonly roleCode    = computed(() => this._user()?.roleCode ?? '');
  readonly permissions = computed(() => this._user()?.permissions ?? []);
  readonly fullName    = computed(() => {
    const u = this._user();
    if (!u) return '';
    return [u.firstName, u.middleName, u.lastName].filter(Boolean).join(' ');
  });

  // ── Role Helpers ───────────────────────────────────────────
  readonly isCEO     = computed(() => ['CEO', 'DIRECTOR', 'MD'].some(r => this.roleName().toUpperCase().includes(r)));
  readonly isHR      = computed(() => ['HR', 'HUMAN_RESOURCE'].some(r => this.roleName().toUpperCase().includes(r)));
  readonly isManager = computed(() => ['MANAGER', 'TEAM_LEAD', 'SUPERVISOR'].some(r => this.roleName().toUpperCase().includes(r)));
  readonly isAdmin   = computed(() => ['ADMIN', 'SUPER_ADMIN'].some(r => this.roleName().toUpperCase().includes(r)));
  readonly isEmployee = computed(() => !this.isCEO() && !this.isHR() && !this.isManager() && !this.isAdmin());

  constructor(private router: Router) {
    this._restoreFromLocalStorage();
  }

  // ── Actions ────────────────────────────────────────────────
  setToken(token: string, sessionId: string): void {
    this._token.set(token);
    this._sessionId.set(sessionId);
    // Store ONLY token & session in localStorage (no user data until fetched from API)
    localStorage.setItem(environment.tokenKey,   token);
    localStorage.setItem(environment.sessionKey, sessionId);
  }

  setUser(user: User): void {
    this._user.set(user);
    // Store user in localStorage for tab persistence — NO sessionStorage used anywhere
    localStorage.setItem(environment.userKey, JSON.stringify(user));
  }

  logout(): void {
    this._token.set(null);
    this._sessionId.set(null);
    this._user.set(null);
    localStorage.removeItem(environment.tokenKey);
    localStorage.removeItem(environment.sessionKey);
    localStorage.removeItem(environment.userKey);
    this.router.navigate(['/login']);
  }

  setLoading(val: boolean): void { this._isLoading.set(val); }

  // ── Permission Helpers ─────────────────────────────────────
  hasPermission(permission: string): boolean {
    // With role-based approach: check roleName OR explicit permissions list
    return this.permissions().includes(permission);
  }

  hasAnyPermission(perms: string[]): boolean {
    return perms.some(p => this.hasPermission(p));
  }

  hasRole(role: string): boolean {
    return this.roleName().toLowerCase().includes(role.toLowerCase()) ||
           this.roleCode().toLowerCase().includes(role.toLowerCase());
  }

  // ── Restore ────────────────────────────────────────────────
  private _restoreFromLocalStorage(): void {
    const token     = localStorage.getItem(environment.tokenKey);
    const sessionId = localStorage.getItem(environment.sessionKey);
    const userStr   = localStorage.getItem(environment.userKey);

    if (token && sessionId) {
      this._token.set(token);
      this._sessionId.set(sessionId);
      if (userStr) {
        try {
          const user = JSON.parse(userStr) as User;
          this._user.set(user);
        } catch {
          this.logout();
        }
      }
    }
  }
}
