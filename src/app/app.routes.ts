import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ── Public ──────────────────────────────────────────────────
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },

  // ── Protected (with Shell layout) ───────────────────────────
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // Dashboard
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },

      // ── Employees ────────────────────────────────────────────
      {
        path: 'employees',
        loadComponent: () => import('./features/employees/employee-list/employee-list.component').then(m => m.EmployeeListComponent),
      },
      {
        path: 'employees/new',
        loadComponent: () => import('./features/employees/employee-form/employee-form.component').then(m => m.EmployeeFormComponent),
      },
      {
        path: 'employees/:id',
        loadComponent: () => import('./features/employees/employee-detail/employee-detail.component').then(m => m.EmployeeDetailComponent),
      },
      {
        path: 'employees/:id/edit',
        loadComponent: () => import('./features/employees/employee-form/employee-form.component').then(m => m.EmployeeFormComponent),
      },
      {
        path: 'departments',
        loadComponent: () => import('./features/employees/departments/departments.component').then(m => m.DepartmentsComponent),
      },
      {
        path: 'designations',
        loadComponent: () => import('./features/employees/designations/designations.component').then(m => m.DesignationsComponent),
      },

      // ── Attendance ───────────────────────────────────────────
      {
        path: 'attendance',
        loadComponent: () => import('./features/attendance/attendance-list/attendance-list.component').then(m => m.AttendanceListComponent),
      },
      {
        path: 'shifts',
        loadComponent: () => import('./features/attendance/shifts/shifts.component').then(m => m.ShiftsComponent),
      },
      {
        path: 'holidays',
        loadComponent: () => import('./features/attendance/holidays/holidays.component').then(m => m.HolidaysComponent),
      },

      // ── Leave ────────────────────────────────────────────────
      {
        path: 'leave/my',
        loadComponent: () => import('./features/leave/my-leaves/my-leaves.component').then(m => m.MyLeavesComponent),
      },
      {
        path: 'leave/approvals',
        loadComponent: () => import('./features/leave/leave-approvals/leave-approvals.component').then(m => m.LeaveApprovalsComponent),
      },
      {
        path: 'leave/balances',
        loadComponent: () => import('./features/leave/leave-balances/leave-balances.component').then(m => m.LeaveBalancesComponent),
      },
      {
        path: 'leave-types',
        loadComponent: () => import('./features/leave/leave-types/leave-types.component').then(m => m.LeaveTypesComponent),
      },

      // ── Payroll ──────────────────────────────────────────────
      {
        path: 'payroll/slips',
        loadComponent: () => import('./features/payroll/salary-slips/salary-slips.component').then(m => m.SalarySlipsComponent),
      },
      {
        path: 'payroll/structures',
        loadComponent: () => import('./features/payroll/salary-structures/salary-structures.component').then(m => m.SalaryStructuresComponent),
      },
      {
        path: 'payroll/components',
        loadComponent: () => import('./features/payroll/salary-components/salary-components.component').then(m => m.SalaryComponentsComponent),
      },
      {
        path: 'payroll/tax-rules',
        loadComponent: () => import('./features/payroll/tax-rules/tax-rules.component').then(m => m.TaxRulesComponent),
      },
      {
        path: 'payroll/process',
        loadComponent: () => import('./features/payroll/process-payroll/process-payroll.component').then(m => m.ProcessPayrollComponent),
      },

      // ── Workflows ────────────────────────────────────────────
      {
        path: 'workflows',
        loadComponent: () => import('./features/workflow/workflow-list/workflow-list.component').then(m => m.WorkflowListComponent),
      },
      {
        path: 'workflows/approvals',
        loadComponent: () => import('./features/workflow/workflow-approvals/workflow-approvals.component').then(m => m.WorkflowApprovalsComponent),
      },

      // ── Travel & Expenses ────────────────────────────────────
      {
        path: 'travel',
        loadComponent: () => import('./features/travel/travel-list/travel-list.component').then(m => m.TravelListComponent),
      },
      {
        path: 'travel/approvals',
        loadComponent: () => import('./features/travel/travel-approvals/travel-approvals.component').then(m => m.TravelApprovalsComponent),
      },
      {
        path: 'expenses',
        loadComponent: () => import('./features/travel/expense-claims/expense-claims.component').then(m => m.ExpenseClaimsComponent),
      },

      // ── Admin ────────────────────────────────────────────────
      {
        path: 'admin/users',
        loadComponent: () => import('./features/admin/users/users.component').then(m => m.UsersComponent),
      },
      {
        path: 'admin/roles',
        loadComponent: () => import('./features/admin/roles/roles.component').then(m => m.RolesComponent),
      },
      {
        path: 'admin/permissions',
        loadComponent: () => import('./features/admin/permissions/permissions.component').then(m => m.PermissionsComponent),
      },
      {
        path: 'admin/company',
        loadComponent: () => import('./features/admin/company/company.component').then(m => m.CompanyComponent),
      },
      {
        path: 'admin/branches',
        loadComponent: () => import('./features/admin/branches/branches.component').then(m => m.BranchesComponent),
      },
      {
        path: 'admin/policies',
        loadComponent: () => import('./features/admin/policies/policies.component').then(m => m.PoliciesComponent),
      },

      // ── Misc ─────────────────────────────────────────────────
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
      },

      // Catch-all
      { path: '**', redirectTo: 'dashboard' },
    ]
  },

  { path: '**', redirectTo: 'login' },
];
