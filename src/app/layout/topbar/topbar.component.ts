import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthStateService } from '../../core/state/auth-state.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="topbar">
      <div class="topbar-left">
        <h1 class="page-heading">{{ getPageTitle() }}</h1>
      </div>

      <div class="topbar-right">
        <!-- Notifications -->
        <button class="topbar-btn" routerLink="/notifications" title="Notifications" id="notif-btn">
          <span class="btn-icon-text">🔔</span>
          <span class="notif-dot"></span>
        </button>

        <!-- User Menu -->
        <div class="user-menu" (click)="toggleMenu()" id="user-menu-btn">
          <div class="avatar">{{ initials }}</div>
          <div class="user-details" *ngIf="showMenu">
            <div class="dropdown-menu" (click)="$event.stopPropagation()">
              <div class="dropdown-header">
                <div class="dh-avatar">{{ initials }}</div>
                <div>
                  <div class="dh-name">{{ user?.fullName }}</div>
                  <div class="dh-email">{{ user?.email }}</div>
                  <div class="dh-role">{{ user?.role }}</div>
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
      padding: 0 24px;
      position: sticky; top: 0; z-index: 100;
    }
    .page-heading { font-size: 1.15rem; font-weight: 600; color: var(--text-primary); }
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
      font-weight: 700; font-size: 0.8rem; color: #fff;
    }
    .user-menu { position: relative; }
    .dropdown-menu {
      position: absolute; right: 0; top: 48px;
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--border-radius); width: 240px;
      box-shadow: var(--shadow-lg); z-index: 999;
      animation: scaleIn 0.2s ease;
      overflow: hidden;
    }
    .dropdown-header {
      display: flex; gap: 12px; padding: 16px;
      background: var(--primary-subtle);
    }
    .dh-avatar {
      width: 40px; height: 40px;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-weight: 700; color: #fff; flex-shrink: 0;
    }
    .dh-name  { font-weight: 600; font-size: 0.875rem; }
    .dh-email { font-size: 0.72rem; color: var(--text-muted); }
    .dh-role  { font-size: 0.7rem; color: var(--primary-light); font-weight: 500; margin-top: 2px; }
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
  showMenu  = false;

  get user()    { return this.authState.user(); }
  get initials() {
    const name = this.user?.fullName ?? '';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  getPageTitle(): string {
    return 'HRMS Portal';
  }

  toggleMenu(): void { this.showMenu = !this.showMenu; }

  logout(): void {
    this.showMenu = false;
    this.authState.logout();
  }
}
