import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthStateService } from '../../core/state/auth-state.service';
import { MENU_ITEMS, MenuItem } from '../../core/config/menu.config';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()">

      <!-- Brand -->
      <div class="sidebar-brand">
        <div class="brand-logo">H</div>
        @if (!collapsed()) {
          <div class="brand-text">
            <span class="brand-name">HRMS</span>
            <span class="brand-tagline">Portal</span>
          </div>
        }
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        @for (item of filteredMenu(); track item.id) {
          <div class="nav-item-wrapper" [class.divider-after]="item.dividerAfter">

            <!-- Single item (no children) -->
            @if (!item.children) {
              <a class="nav-item"
                 [routerLink]="item.route"
                 [class.active]="isActive(item.route)"
                 (click)="onItemClick(item)">
                <span class="nav-icon">{{ item.icon }}</span>
                @if (!collapsed()) {
                  <span class="nav-label">{{ item.label }}</span>
                  @if (item.badge) { <span class="nav-badge">{{ item.badge }}</span> }
                }
              </a>
            }

            <!-- Group item (with children) -->
            @if (item.children) {
              <div class="nav-group">
                <div class="nav-item nav-group-toggle"
                     [class.active]="isGroupActive(item)"
                     [class.open]="openGroups().has(item.id)"
                     (click)="toggleGroup(item.id)">
                  <span class="nav-icon">{{ item.icon }}</span>
                  @if (!collapsed()) {
                    <span class="nav-label">{{ item.label }}</span>
                    <span class="nav-chevron" [class.rotated]="openGroups().has(item.id)">›</span>
                  }
                </div>

                @if (!collapsed() && openGroups().has(item.id)) {
                  <div class="nav-children">
                    @for (child of filterChildren(item.children); track child.id) {
                      <a class="nav-child"
                         [routerLink]="child.route"
                         [class.active]="isActive(child.route)"
                         (click)="onItemClick(child)">
                        <span class="child-icon">{{ child.icon }}</span>
                        <span class="child-label">{{ child.label }}</span>
                      </a>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      </nav>

      <!-- User Profile at bottom -->
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="user-avatar">{{ initials() }}</div>
          @if (!collapsed()) {
            <div class="user-info">
              <span class="user-name">{{ authState.user()?.fullName }}</span>
              <span class="user-role">{{ authState.user()?.role }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Collapse toggle -->
      <button class="collapse-btn" (click)="toggleCollapse()" [title]="collapsed() ? 'Expand' : 'Collapse'">
        {{ collapsed() ? '›' : '‹' }}
      </button>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width);
      min-height: 100vh;
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0; top: 0; bottom: 0;
      z-index: 200;
      transition: width var(--transition);
      overflow: hidden;
    }
    .sidebar.collapsed { width: var(--sidebar-collapsed); }

    /* Brand */
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 16px;
      border-bottom: 1px solid var(--border);
      min-height: var(--topbar-height);
    }
    .brand-logo {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 1.1rem; color: #fff;
      flex-shrink: 0;
      box-shadow: var(--shadow-glow);
    }
    .brand-name { display: block; font-weight: 700; font-size: 1rem; color: var(--text-primary); }
    .brand-tagline { display: block; font-size: 0.7rem; color: var(--text-muted); }

    /* Nav */
    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 12px 8px;
      scrollbar-width: thin;
    }
    .nav-item-wrapper { margin-bottom: 2px; }
    .nav-item-wrapper.divider-after { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: var(--border-radius-sm);
      cursor: pointer;
      transition: all var(--transition);
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      position: relative;
    }
    .nav-item:hover { background: var(--primary-subtle); color: var(--primary-light); }
    .nav-item.active {
      background: var(--primary-subtle);
      color: var(--primary-light);
      border-left: 3px solid var(--primary);
    }
    .nav-icon { font-size: 1rem; flex-shrink: 0; width: 20px; text-align: center; }
    .nav-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .nav-badge {
      background: var(--primary); color: #fff;
      font-size: 0.65rem; font-weight: 700;
      padding: 2px 6px; border-radius: 99px;
    }
    .nav-chevron {
      font-size: 1.1rem; color: var(--text-muted);
      transition: transform var(--transition);
    }
    .nav-chevron.rotated { transform: rotate(90deg); }

    /* Children */
    .nav-children { padding: 4px 0 4px 16px; }
    .nav-child {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: var(--border-radius-sm);
      color: var(--text-muted);
      font-size: 0.82rem;
      font-weight: 400;
      text-decoration: none;
      transition: all var(--transition);
      cursor: pointer;
    }
    .nav-child:hover { color: var(--primary-light); background: var(--primary-subtle); }
    .nav-child.active { color: var(--primary-light); font-weight: 500; }
    .child-icon { font-size: 0.85rem; opacity: 0.7; flex-shrink: 0; }

    /* Footer */
    .sidebar-footer {
      padding: 12px 8px;
      border-top: 1px solid var(--border);
    }
    .sidebar-user {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      border-radius: var(--border-radius-sm);
    }
    .user-avatar {
      width: 34px; height: 34px;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.8rem; color: #fff;
      flex-shrink: 0;
    }
    .user-name  { display: block; font-size: 0.82rem; font-weight: 600; color: var(--text-primary); }
    .user-role  { display: block; font-size: 0.7rem; color: var(--text-muted); }

    /* Collapse btn */
    .collapse-btn {
      position: absolute;
      right: -12px; top: 50%;
      transform: translateY(-50%);
      width: 24px; height: 24px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 50%;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.9rem;
      color: var(--text-secondary);
      z-index: 201;
      transition: all var(--transition);
    }
    .collapse-btn:hover { background: var(--primary); color: #fff; border-color: var(--primary); }
  `]
})
export class SidebarComponent implements OnInit {

  authState = inject(AuthStateService);
  private router = inject(Router);

  collapsed  = signal(false);
  openGroups = signal<Set<string>>(new Set());

  filteredMenu = computed(() => {
    const user = this.authState.user();
    if (!user) return [];
    return MENU_ITEMS.filter(item => this._canSeeItem(item, user));
  });

  initials = computed(() => {
    const name = this.authState.user()?.fullName ?? '';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  });

  ngOnInit(): void {
    // Auto-open group for active route
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this._openActiveGroup());
    this._openActiveGroup();
  }

  toggleCollapse(): void {
    this.collapsed.update(v => !v);
  }

  toggleGroup(id: string): void {
    this.openGroups.update(set => {
      const newSet = new Set(set);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  }

  isActive(route?: string): boolean {
    if (!route) return false;
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  isGroupActive(item: MenuItem): boolean {
    return item.children?.some(c => this.isActive(c.route)) ?? false;
  }

  filterChildren(children: MenuItem[]): MenuItem[] {
    const user = this.authState.user();
    if (!user) return [];
    return children.filter(c => this._canSeeItem(c, user));
  }

  onItemClick(item: MenuItem): void {
    // On mobile, collapse sidebar after navigation
    if (window.innerWidth < 768) {
      this.collapsed.set(true);
    }
  }

  private _canSeeItem(item: MenuItem, user: any): boolean {
    if (item.permission && !this.authState.hasPermission(item.permission)) {
      // Also allow if has child permissions
      if (item.children) {
        return item.children.some(c => !c.permission || this.authState.hasPermission(c.permission));
      }
      return false;
    }
    if (item.roles && !item.roles.some(r => this.authState.hasRole(r))) {
      return false;
    }
    return true;
  }

  private _openActiveGroup(): void {
    MENU_ITEMS.forEach(item => {
      if (item.children?.some(c => this.isActive(c.route))) {
        this.openGroups.update(set => new Set([...set, item.id]));
      }
    });
  }
}
