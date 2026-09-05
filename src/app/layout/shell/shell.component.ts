import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { ToastComponent } from '../../shared/toast/toast.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopbarComponent, ToastComponent],
  template: `
    <div class="app-shell">
      <app-sidebar></app-sidebar>
      <div class="main-content">
        <app-topbar></app-topbar>
        <main class="main-area">
          <router-outlet></router-outlet>
        </main>
      </div>
      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      min-height: 100vh;
    }
    .main-content {
      flex: 1;
      margin-left: var(--sidebar-width);
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      transition: margin-left var(--transition);
    }
    .main-area {
      flex: 1;
      overflow-y: auto;
    }

    @media (max-width: 768px) {
      .main-content {
        margin-left: var(--sidebar-collapsed);
      }
    }
  `]
})
export class ShellComponent {}
