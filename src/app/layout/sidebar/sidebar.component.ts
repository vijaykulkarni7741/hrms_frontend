import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthStateService } from 'src/app/core/state/auth-state.service';
import { MENU_ITEMS, MenuItem } from 'src/app/core/config/menu.config';
import { LayoutService } from 'src/app/core/services/layout.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()">
      <!-- Header / Logo section -->
      <div class="sidebar-header">
        <div class="brand-info" *ngIf="!collapsed()">
          <img *ngIf="orgLogo" [src]="orgLogo" class="brand-logo-img" alt="Organization Logo" />
          <span *ngIf="!orgLogo" class="brand-logo">🏢</span>
          <span class="brand-title" [title]="orgName">{{ orgName }}</span>
        </div>
        <div class="brand-logo-collapsed" *ngIf="collapsed()">
          <img *ngIf="orgLogo" [src]="orgLogo" class="brand-logo-img-sm" alt="Logo" />
          <span *ngIf="!orgLogo">🏢</span>
        </div>
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
    </aside>
  `,
  styles: [`
    :host {
      position: relative;
      z-index: 200;
    }
    .sidebar {
      width: var(--sidebar-width);
      height: 100vh;
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0; top: 0; bottom: 0;
      z-index: 200;
      transition: width var(--transition);
      box-shadow: 2px 0 12px rgba(0,0,0,0.04);
      overflow: hidden;
    }
    .sidebar.collapsed { width: var(--sidebar-collapsed); }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      padding: 0 1rem;
      border-bottom: 1px solid var(--border);
      height: var(--topbar-height);
    }
    .brand-info {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-weight: 800;
      font-size: 0.95rem;
      color: var(--primary);
      overflow: hidden;
    }
    .brand-logo { font-size: 1.25rem; flex-shrink: 0; }
    .brand-logo-img {
      width: 32px; height: 32px;
      border-radius: 6px;
      object-fit: contain;
      flex-shrink: 0;
    }
    .brand-logo-img-sm {
      width: 28px; height: 28px;
      border-radius: 6px;
      object-fit: contain;
      margin: 0 auto;
    }
    .brand-logo-collapsed { font-size: 1.35rem; margin: 0 auto; display: flex; align-items: center; justify-content: center; }
    .brand-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 165px; font-weight: 800; color: #891EA2; }

    .header-toggle-btn {
      background: var(--primary-subtle);
      color: var(--primary);
      border: 1px solid var(--border);
      border-radius: var(--border-radius-sm);
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: 0.85rem; font-weight: 800;
      transition: all var(--transition);
      margin: 0 auto;
    }
    .header-toggle-btn:hover {
      background: var(--primary);
      color: #ffffff;
    }

    /* Nav */
    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
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

    /* Edge Floating Collapse btn */
    .collapse-btn {
      position: absolute;
      right: -14px; top: 50%;
      transform: translateY(-50%);
      width: 28px; height: 28px;
      background: #891EA2;
      border: 2px solid #ffffff;
      border-radius: 50%;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; font-weight: 800;
      color: #ffffff;
      z-index: 300;
      box-shadow: 0 4px 12px rgba(137, 30, 162, 0.4);
      transition: all var(--transition);
    }
    .collapse-btn:hover { transform: translateY(-50%) scale(1.2); background: #731788; }
  `]
})
export class SidebarComponent implements OnInit {

  authState = inject(AuthStateService);
  layout = inject(LayoutService);
  private router = inject(Router);

  get user() { return this.authState.user(); }

  get orgLogo(): string | null {
    const u = this.user as any;
    return u?.unitLogo || u?.organizationLogo || u?.companyLogo || null;
  }

  get orgName(): string {
    return this.user?.unitName || this.user?.organizationName || 'HRMS Portal';
  }

  get collapsed() { return this.layout.sidebarCollapsed; }
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
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this._openActiveGroup());
    this._openActiveGroup();
  }

  toggleCollapse(): void {
    this.layout.toggleSidebar();
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
    if (item.roles && item.roles.length > 0) {
      const uRole = (user.role || user.roleName || user.roleCode || user.status || '').toUpperCase();
      const match = item.roles.some(r => uRole.includes(r.toUpperCase()) || this.authState.hasRole(r));
      if (!match) return false;
    }
    if (item.permission && !this.authState.hasPermission(item.permission)) {
      if (item.children) {
        return item.children.some(c => this._canSeeItem(c, user));
      }
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
