import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { ToastComponent } from 'src/app/shared/toast/toast.component';
import { LayoutService } from 'src/app/core/services/layout.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopbarComponent, ToastComponent],
  template: `
    <div class="app-shell">
      <app-sidebar></app-sidebar>
      <div class="main-content" [style.margin-left]="layout.sidebarCollapsed() ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)'">
        <app-topbar></app-topbar>
        
        <!-- Scrollable Main Page Area -->
        <main class="main-area">
          <router-outlet></router-outlet>
        </main>
        
        <!-- Fixed Sticky Bottom Footer Bar -->
        <footer class="app-footer-bar">
          <div class="footer-center">
            <span>HRMS Ver 1.0.00 | 2026 © Powered by  Medimaze Solution Pvt Ltd.</span>
          </div>
        </footer>
      </div>
      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }
    .main-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      transition: margin-left var(--transition);
    }
    .main-area {
      flex: 1;
      min-width: 0;
      overflow-y: auto;
      overflow-x: hidden;
      width: 100%;
    }
    .app-footer-bar {
      flex-shrink: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0.4rem 1.25rem;
      background: #e2e8f0;
      border-top: 1px solid #cbd5e1;
      font-size: 0.75rem;
      color: #1e3a8a;
      font-weight: 500;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      text-align: center;
    }
    .footer-center {
      text-align: center;
    }

    @media (max-width: 768px) {
      .main-content {
        margin-left: var(--sidebar-collapsed) !important;
      }
    }
  `]
})
export class ShellComponent {
  layout = inject(LayoutService);
}
