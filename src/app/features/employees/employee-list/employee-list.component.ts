import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

export interface Employee {
  id: number;
  employeeCode: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  officialEmail?: string;
  mobileNumber: string;
  gender: string;
  dateOfBirth: string;
  joiningDate: string;
  employmentStatus: string;
  employeeType: string;
  department?: { id: number; departmentName: string };
  designation?: { id: number; designationName: string };
  role?: { id: number; roleName: string };
  workLocation?: string;
  isActive: boolean;
  profilePhoto?: string;
}

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2 class="page-title">👥 Employees</h2>
          <p class="page-subtitle">{{ total() }} total employees</p>
        </div>
        <a class="btn btn-primary" routerLink="/employees/new" id="add-employee-btn">
          ➕ Add Employee
        </a>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <div class="search-box form-group" style="margin-bottom:0; flex:1; min-width:200px;">
          <span class="search-icon">🔍</span>
          <input class="form-control" placeholder="Search by name, code, email…" [(ngModel)]="searchTerm" (ngModelChange)="onSearch()" id="emp-search" />
        </div>
        <select class="form-control" style="width:160px;" [(ngModel)]="filterStatus" (ngModelChange)="onSearch()" id="emp-status-filter">
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="RESIGNED">Resigned</option>
        </select>
        <select class="form-control" style="width:160px;" [(ngModel)]="filterType" (ngModelChange)="onSearch()" id="emp-type-filter">
          <option value="">All Types</option>
          <option value="FULL_TIME">Full Time</option>
          <option value="PART_TIME">Part Time</option>
          <option value="CONTRACT">Contract</option>
          <option value="INTERN">Intern</option>
        </select>
      </div>

      <!-- Table -->
      <div class="card" style="padding:0; overflow:hidden;">
        @if (isLoading()) {
          <div class="flex-center" style="padding:60px;">
            <div class="spinner spinner-lg"></div>
          </div>
        } @else if (filtered().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">👥</div>
            <h3>No employees found</h3>
            <p>Try adjusting your search or add a new employee.</p>
          </div>
        } @else {
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Code</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Type</th>
                  <th>Join Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (emp of paginated(); track emp.id) {
                  <tr>
                    <td>
                      <div style="display:flex; align-items:center; gap:10px;">
                        <div class="emp-avatar">{{ initials(emp) }}</div>
                        <div>
                          <div style="font-weight:600;">{{ emp.firstName }} {{ emp.lastName }}</div>
                          <div style="font-size:0.75rem; color:var(--text-muted);">{{ emp.officialEmail || emp.email }}</div>
                        </div>
                      </div>
                    </td>
                    <td><code style="background:var(--bg-input);padding:2px 6px;border-radius:4px;font-size:0.8rem;">{{ emp.employeeCode }}</code></td>
                    <td>{{ emp.department?.departmentName || '—' }}</td>
                    <td>{{ emp.designation?.designationName || '—' }}</td>
                    <td><span class="badge badge-info">{{ emp.employeeType || '—' }}</span></td>
                    <td>{{ formatDate(emp.joiningDate) }}</td>
                    <td>
                      <span class="badge" [class]="statusBadge(emp.employmentStatus)">
                        {{ emp.employmentStatus }}
                      </span>
                    </td>
                    <td>
                      <div style="display:flex; gap:6px;">
                        <a class="btn btn-secondary btn-sm btn-icon" [routerLink]="['/employees', emp.id]" title="View" [id]="'view-emp-'+emp.id">👁️</a>
                        <a class="btn btn-secondary btn-sm btn-icon" [routerLink]="['/employees', emp.id, 'edit']" title="Edit" [id]="'edit-emp-'+emp.id">✏️</a>
                        <button class="btn btn-sm btn-icon" [class]="emp.isActive ? 'btn-danger' : 'btn-success'"
                                (click)="toggleActive(emp)" [title]="emp.isActive ? 'Deactivate' : 'Activate'" [id]="'toggle-emp-'+emp.id">
                          {{ emp.isActive ? '🚫' : '✅' }}
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="pagination">
            <span class="text-muted" style="font-size:0.8rem;">
              Showing {{ (page()-1)*pageSize+1 }}–{{ Math.min(page()*pageSize, filtered().length) }} of {{ filtered().length }}
            </span>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-secondary btn-sm" (click)="prevPage()" [disabled]="page()===1" id="emp-prev-page">‹ Prev</button>
              @for (p of pages(); track p) {
                <button class="btn btn-sm" [class]="p===page() ? 'btn-primary' : 'btn-secondary'" (click)="goPage(p)">{{ p }}</button>
              }
              <button class="btn btn-secondary btn-sm" (click)="nextPage()" [disabled]="page()===totalPages()" id="emp-next-page">Next ›</button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .emp-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.75rem; color: #fff; flex-shrink: 0;
    }
    .pagination {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 20px; border-top: 1px solid var(--border);
    }
    code { font-family: monospace; }
  `]
})
export class EmployeeListComponent implements OnInit {
  private api   = inject(ApiService);
  private toast = inject(ToastService);
  Math = Math;

  employees = signal<Employee[]>([]);
  isLoading = signal(true);
  searchTerm   = '';
  filterStatus = '';
  filterType   = '';
  page     = signal(1);
  pageSize = 10;

  filtered = signal<Employee[]>([]);
  total    = signal(0);
  paginated   = signal<Employee[]>([]);
  totalPages  = signal(1);

  ngOnInit() { this.load(); }

  load() {
    this.isLoading.set(true);
    this.api.post<Employee[]>('/v1/employees/list', {}).subscribe({
      next: (res) => {
        const list = res.data ?? [];
        this.employees.set(list);
        this.applyFilter();
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onSearch() { this.page.set(1); this.applyFilter(); }

  applyFilter() {
    let list = this.employees();
    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(e =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
        e.employeeCode.toLowerCase().includes(q) ||
        (e.email || '').toLowerCase().includes(q)
      );
    }
    if (this.filterStatus) list = list.filter(e => e.employmentStatus === this.filterStatus);
    if (this.filterType)   list = list.filter(e => e.employeeType === this.filterType);
    this.filtered.set(list);
    this.total.set(list.length);
    this.totalPages.set(Math.ceil(list.length / this.pageSize) || 1);
    this.updatePage();
  }

  updatePage() {
    const start = (this.page() - 1) * this.pageSize;
    this.paginated.set(this.filtered().slice(start, start + this.pageSize));
  }

  pages(): number[] {
    const t = this.totalPages();
    const c = this.page();
    const range: number[] = [];
    for (let i = Math.max(1, c-2); i <= Math.min(t, c+2); i++) range.push(i);
    return range;
  }

  prevPage() { if (this.page() > 1) { this.page.update(p => p-1); this.updatePage(); } }
  nextPage() { if (this.page() < this.totalPages()) { this.page.update(p => p+1); this.updatePage(); } }
  goPage(p: number) { this.page.set(p); this.updatePage(); }

  toggleActive(emp: Employee) {
    this.api.post(`/v1/employees/toggle-active`, { id: emp.id }).subscribe({
      next: () => {
        emp.isActive = !emp.isActive;
        this.toast.success(`Employee ${emp.isActive ? 'activated' : 'deactivated'}.`);
        this.employees.set([...this.employees()]);
      }
    });
  }

  initials(e: Employee) {
    return `${e.firstName?.[0] ?? ''}${e.lastName?.[0] ?? ''}`.toUpperCase();
  }
  formatDate(d: string) { return d ? new Date(d).toLocaleDateString('en-IN') : '—'; }
  statusBadge(s: string) {
    const map: Record<string, string> = { ACTIVE: 'badge-success', INACTIVE: 'badge-warning', RESIGNED: 'badge-danger', PROBATION: 'badge-info' };
    return map[s] ?? 'badge-info';
  }
}
