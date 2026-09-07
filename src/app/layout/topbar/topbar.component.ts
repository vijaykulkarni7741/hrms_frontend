import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthStateService } from 'src/app/core/state/auth-state.service';
import { LayoutService } from 'src/app/core/services/layout.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="topbar">
      <div class="topbar-left">
        <button class="sidebar-toggle-btn" (click)="layout.toggleSidebar()" title="Toggle Sidebar Navigation" id="sidebar-toggle-btn">
          <span>☰</span>
        </button>
        <div class="header-branding">
          <h1 class="page-title">Welcome back, {{ userFirstName }}! 👋</h1>
          <span class="unit-tag" *ngIf="unitDisplayName">
            🏢 {{ unitDisplayName }}
          </span>
        </div>
      </div>

      <div class="topbar-right">
        <!-- Notifications -->
        <button class="topbar-btn" routerLink="/notifications" title="Notifications" id="notif-btn">
          <span class="btn-icon-text">🔔</span>
          <span class="notif-dot"></span>
        </button>

        <!-- User Menu -->
        <div class="user-menu" (click)="toggleMenu()" id="user-menu-btn">
          <img *ngIf="userPhoto" [src]="userPhoto" class="avatar-img" alt="Profile Photo" />
          <div *ngIf="!userPhoto" class="avatar">{{ initials }}</div>

          <div class="user-details" *ngIf="showMenu">
            <div class="dropdown-menu" (click)="$event.stopPropagation()">
              <div class="dropdown-header">
                <img *ngIf="userPhoto" [src]="userPhoto" class="dh-avatar-img" alt="Profile Photo" />
                <div *ngIf="!userPhoto" class="dh-avatar">{{ initials }}</div>
                <div>
                  <div class="dh-name">{{ displayName }}</div>
                  <div class="dh-email">{{ user?.email || 'employee@hrms.com' }}</div>
                  <div class="dh-role">{{ userRole }}</div>
                </div>
              </div>
              <div class="divider"></div>
              <a class="dropdown-item" routerLink="/profile" (click)="toggleMenu()">👤 My Profile</a>
              <a class="dropdown-item" routerLink="/notifications" (click)="toggleMenu()">🔔 Notifications</a>
              <div class="divider"></div>
              <button class="dropdown-item danger" (click)="logout()" id="logout-btn">🚪 Logout</button>
            </div>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      height: var(--topbar-height);
      background: var(--bg-card);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.25rem;
      position: sticky; top: 0; z-index: 100;
    }
    .topbar-left { display: flex; align-items: center; gap: 0.85rem; }
    
    .sidebar-toggle-btn {
      background: var(--primary-subtle);
      color: var(--primary);
      border: 1px solid var(--border);
      border-radius: var(--border-radius-sm);
      width: 38px; height: 38px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.2rem; font-weight: 800; cursor: pointer;
      transition: all var(--transition);
    }
    .sidebar-toggle-btn:hover {
      background: var(--primary);
      color: #ffffff;
      border-color: var(--primary);
      box-shadow: 0 2px 8px rgba(137, 30, 162, 0.25);
    }

    .header-branding {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .page-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
      letter-spacing: -0.01em;
    }
    .unit-tag {
      font-size: 0.75rem;
      font-weight: 600;
      background: var(--primary-subtle);
      color: var(--primary-light);
      padding: 4px 12px;
      border-radius: 20px;
      border: 1px solid rgba(147, 51, 234, 0.2);
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .topbar-right { display: flex; align-items: center; gap: 12px; }
    .topbar-btn {
      width: 38px; height: 38px;
      background: var(--bg-input); border: 1px solid var(--border);
      border-radius: var(--border-radius-sm); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      position: relative; transition: all var(--transition);
    }
    .topbar-btn:hover { border-color: var(--primary); }
    .btn-icon-text { font-size: 1rem; }
    .notif-dot {
      width: 8px; height: 8px; background: var(--primary);
      border-radius: 50%; position: absolute; top: 6px; right: 6px;
    }
    .avatar {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      border-radius: 50%; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.82rem; color: #fff;
      box-shadow: var(--shadow-sm);
    }
    .avatar-img {
      width: 36px; height: 36px;
      border-radius: 50%; cursor: pointer;
      object-fit: cover;
      border: 2px solid var(--primary);
      box-shadow: var(--shadow-sm);
    }
    .user-menu { position: relative; }
    .dropdown-menu {
      position: absolute; right: 0; top: 48px;
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--border-radius); width: 250px;
      box-shadow: var(--shadow-lg); z-index: 999;
      animation: scaleIn 0.2s ease;
      overflow: hidden;
    }
    .dropdown-header {
      display: flex; gap: 12px; padding: 16px;
      background: var(--primary-subtle); align-items: center;
    }
    .dh-avatar {
      width: 42px; height: 42px;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-weight: 700; color: #fff; flex-shrink: 0; font-size: 0.9rem;
    }
    .dh-avatar-img {
      width: 42px; height: 42px;
      border-radius: 50%; object-fit: cover;
      border: 2px solid var(--primary); flex-shrink: 0;
    }
    .dh-name  { font-weight: 600; font-size: 0.875rem; color: var(--text-primary); }
    .dh-email { font-size: 0.72rem; color: var(--text-muted); }
    .dh-role  { font-size: 0.7rem; color: var(--primary-light); font-weight: 600; margin-top: 2px; }
    .dropdown-item {
      display: flex; align-items: center; gap: 10px;
      padding: 11px 16px; color: var(--text-secondary);
      font-size: 0.875rem; cursor: pointer; transition: all var(--transition);
      text-decoration: none; width: 100%; border: none; background: none; font-family: inherit;
    }
    .dropdown-item:hover { background: var(--primary-subtle); color: var(--primary-light); }
    .dropdown-item.danger { color: var(--danger); }
    .dropdown-item.danger:hover { background: var(--danger-subtle); }
    .divider { height: 1px; background: var(--border); margin: 4px 0; }
  `]
})
export class TopbarComponent {
  authState = inject(AuthStateService);
  layout = inject(LayoutService);
  showMenu  = false;

  get user() { return this.authState.user(); }

  get userPhoto(): string | null {
    return this.user?.profilePhoto || this.user?.photoUrl || this.user?.avatarUrl || null;
  }

  get initials(): string {
    const fn = (this.user?.firstName || '').trim();
    const ln = (this.user?.lastName || '').trim();

    if (fn && ln) {
      return (fn.charAt(0) + ln.charAt(0)).toUpperCase();
    }
    if (fn) {
      return fn.substring(0, 2).toUpperCase();
    }
    if (this.user?.fullName) {
      const parts = this.user.fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
      }
      return parts[0].substring(0, 2).toUpperCase();
    }
    return 'HR';
  }

  get userFirstName(): string {
    return this.user?.firstName || this.user?.fullName?.split(' ')[0] || 'User';
  }

  get displayName(): string {
    if (this.user?.fullName) return this.user.fullName;
    if (this.user?.firstName || this.user?.lastName) {
      return [this.user.firstName, this.user.lastName].filter(Boolean).join(' ');
    }
    return 'HRMS Employee';
  }

  get unitDisplayName(): string {
    return this.user?.unitName || this.user?.organizationName || 'Main Office Unit';
  }

  get userRole(): string {
    return this.user?.role || this.user?.roleName || 'Employee';
  }

  toggleMenu(): void { this.showMenu = !this.showMenu; }

  logout(): void {
    this.showMenu = false;
    this.authState.logout();
  }
}
