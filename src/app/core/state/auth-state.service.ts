import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { encryptStorageData, decryptStorageData } from '../utils/crypto.utils';

export interface User {
  // Existing fields
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
  organizationLogo?: string;
  unitId?: number;
  unitName?: string;
  unitLogo?: string;
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
  // Added fields for UI templates
  fullName?: string;
  role?: string;
  profilePhoto?: string;
  photoUrl?: string;
  avatarUrl?: string;
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
    this._restoreFromSessionStorage();
  }

  // ── Actions ────────────────────────────────────────────────
  setToken(token: string, sessionId: string): void {
    this._token.set(token);
    this._sessionId.set(sessionId);
    sessionStorage.setItem(environment.tokenKey, encryptStorageData(token));
    sessionStorage.setItem(environment.sessionKey, encryptStorageData(sessionId));
  }

  setUser(user: User): void {
    this._user.set(user);
    sessionStorage.setItem(environment.userKey, encryptStorageData(JSON.stringify(user)));
  }

  logout(): void {
    this._token.set(null);
    this._sessionId.set(null);
    this._user.set(null);
    sessionStorage.removeItem(environment.tokenKey);
    sessionStorage.removeItem(environment.sessionKey);
    sessionStorage.removeItem(environment.userKey);
    this.router.navigate(['/login']);
  }

  setLoading(val: boolean): void { this._isLoading.set(val); }

  // ── Permission Helpers ─────────────────────────────────────
  hasPermission(permission: string): boolean {
    if (!permission) return true;
    if (this.isAdmin()) return true;

    const user = this._user();

    // 1. Check User-Specific Overrides from Session Storage / Memory
    try {
      const uStr = decryptStorageData(sessionStorage.getItem('hrms_user_overrides'));
      if (uStr && user) {
        const userOverridesList = JSON.parse(uStr);
        const myOverride = userOverridesList.find((u: any) =>
          (u.userId && Number(u.userId) === Number(user.id)) ||
          (u.employeeCode && user.employeeCode && u.employeeCode === user.employeeCode)
        );
        if (myOverride && myOverride.overrides && myOverride.overrides[permission]) {
          const ov = myOverride.overrides[permission];
          if (ov === 'GRANT') return true;
          if (ov === 'DENY') return false;
        }
      }
    } catch {
      // fallback
    }

    // 2. Check Role-Wise Matrix from Session Storage / Memory
    try {
      const rStr = decryptStorageData(sessionStorage.getItem('hrms_role_matrix'));
      if (rStr && user) {
        const roleMatrixList = JSON.parse(rStr);
        const myRole = roleMatrixList.find((r: any) =>
          (r.roleCode && user.roleCode && r.roleCode === user.roleCode) ||
          (r.roleCode && user.role && r.roleCode === user.role)
        );
        if (myRole && Array.isArray(myRole.assignedButtonCodes)) {
          if (myRole.assignedButtonCodes.includes(permission)) return true;
        }
      }
    } catch {
      // fallback
    }

    // 3. Fallback to default HR rights or API permissions array
    if (this.isHR()) return true;
    const perms = this.permissions();
    if (!perms || perms.length === 0) return false;
    return perms.includes(permission) || perms.includes('*');
  }

  hasAnyPermission(perms: string[]): boolean {
    return perms.some(p => this.hasPermission(p));
  }

  hasRole(role: string): boolean {
    if (this.isAdmin()) return true;
    const rName = (this.roleName() || '').toLowerCase();
    const rCode = (this.roleCode() || '').toLowerCase();
    const uRole = (this._user()?.role || '').toLowerCase();
    const target = role.toLowerCase();
    return rName.includes(target) || rCode.includes(target) || uRole.includes(target);
  }

  // ── Restore ────────────────────────────────────────────────
  private _restoreFromSessionStorage(): void {
    const rawToken     = sessionStorage.getItem(environment.tokenKey);
    const rawSessionId = sessionStorage.getItem(environment.sessionKey);
    const rawUserStr   = sessionStorage.getItem(environment.userKey);

    const token     = decryptStorageData(rawToken);
    const sessionId = decryptStorageData(rawSessionId);
    const userStr   = decryptStorageData(rawUserStr);

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
