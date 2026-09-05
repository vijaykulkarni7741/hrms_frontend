import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthStateService } from '../../../core/state/auth-state.service';
import { CeoDashboardComponent } from '../ceo-dashboard/ceo-dashboard.component';
import { HrDashboardComponent } from '../hr-dashboard/hr-dashboard.component';
import { ManagerDashboardComponent } from '../manager-dashboard/manager-dashboard.component';
import { EmployeeDashboardComponent } from '../employee-dashboard/employee-dashboard.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CeoDashboardComponent, HrDashboardComponent, ManagerDashboardComponent, EmployeeDashboardComponent],
  template: `
    @if (authState.isCEO()) {
      <app-ceo-dashboard></app-ceo-dashboard>
    } @else if (authState.isHR() || authState.isAdmin()) {
      <app-hr-dashboard></app-hr-dashboard>
    } @else if (authState.isManager()) {
      <app-manager-dashboard></app-manager-dashboard>
    } @else {
      <app-employee-dashboard></app-employee-dashboard>
    }
  `,
})
export class DashboardComponent {
  authState = inject(AuthStateService);
}
