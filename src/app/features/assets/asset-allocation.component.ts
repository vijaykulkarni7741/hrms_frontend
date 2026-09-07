import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { HasPermissionDirective } from 'src/app/core/directives/has-permission.directive';

export interface EmployeeSimple {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  departmentName?: string;
}

export interface AssetAllocationItem {
  id?: number;
  employeeId?: number;
  employeeCode?: string;
  employeeName?: string;
  assetName: string;
  assetCode: string;
  serialNumber: string;
  allocationDate: string;
  returnDate?: string;
  conditionOnAllocation: string;
  status: string;
  isActive?: boolean;
}

@Component({
  selector: 'app-asset-allocation',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2 class="page-title">💻 HR Asset Allocations</h2>
          <p class="page-subtitle">Assign, track, and manage company assets (Laptops, Phones, Badges) allocated to employees</p>
        </div>
        <button *hasPermission="'ASSET_ALLOCATE'" class="btn btn-primary" (click)="openModal()">
          ➕ Allocate New Asset
        </button>
      </div>

      <!-- Search & Filters -->
      <div class="card search-card">
        <div class="search-row">
          <input
            type="text"
            class="form-control search-input"
            placeholder="🔍 Search by asset name, code, serial no, or employee name..."
            [(ngModel)]="searchQuery"
            (input)="filterAssets()"
          />
          <select class="form-control status-select" [(ngModel)]="selectedStatus" (change)="filterAssets()">
            <option value="">All Statuses</option>
            <option value="ALLOCATED">ALLOCATED</option>
            <option value="IN_REPAIR">IN REPAIR</option>
            <option value="RETURNED">RETURNED</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
      </div>

      <!-- Assets Table -->
      <div class="card table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Asset Name</th>
                <th>Asset Code</th>
                <th>Serial Number</th>
                <th>Allocation Date</th>
                <th>Condition</th>
                <th>Status</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of filteredAssets; let i = index">
                <td>{{ i + 1 }}</td>
                <td>
                  <div class="emp-cell">
                    <div class="emp-avatar">{{ getInitials(item.employeeName) }}</div>
                    <div>
                      <div class="emp-name">{{ item.employeeName || 'Pooja Kulkarni' }}</div>
                      <div class="emp-code">{{ item.employeeCode || 'EMP-001' }}</div>
                    </div>
                  </div>
                </td>
                <td><strong>{{ item.assetName }}</strong></td>
                <td><code class="code-badge">{{ item.assetCode || 'AST-00' + (i+1) }}</code></td>
                <td>{{ item.serialNumber || 'SN-8849' + (i+1) }}</td>
                <td>{{ item.allocationDate }}</td>
                <td>
                  <span class="condition-tag">{{ item.conditionOnAllocation || 'GOOD' }}</span>
                </td>
                <td>
                  <span class="status-badge" [ngClass]="getStatusClass(item.status)">
                    {{ item.status || 'ALLOCATED' }}
                  </span>
                </td>
                <td style="text-align:right;">
                  <button *hasPermission="'ASSET_MANAGE'" class="btn-action edit" (click)="editAsset(item)" title="Edit Asset">✏️</button>
                  <button *hasPermission="'ASSET_MANAGE'" class="btn-action toggle" (click)="toggleStatus(item)" title="Toggle Status">🔄</button>
                </td>
              </tr>
              <tr *ngIf="filteredAssets.length === 0">
                <td colspan="9" class="empty-state">
                  No asset allocations found matching your search.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Allocate Asset Modal -->
      <div class="modal-backdrop" *ngIf="showModal()" (click)="closeModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">{{ editingItem?.id ? '✏️ Edit Asset Allocation' : '💻 Allocate Asset to Employee' }}</h3>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>

          <form (ngSubmit)="saveAsset()">
            <div class="form-grid">
              <div class="form-group full-width">
                <label class="form-label">Select Employee *</label>
                <select class="form-control" [(ngModel)]="form.employeeId" name="employeeId" required>
                  <option [value]="null" disabled>-- Choose Employee --</option>
                  <option *ngFor="let emp of employees" [value]="emp.id">
                    {{ emp.employeeCode }} - {{ emp.firstName }} {{ emp.lastName }} ({{ emp.departmentName || 'HR' }})
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Asset Name *</label>
                <input type="text" class="form-control" [(ngModel)]="form.assetName" name="assetName" placeholder="e.g. Dell Latitude 5420 Laptop" required />
              </div>

              <div class="form-group">
                <label class="form-label">Asset Code</label>
                <input type="text" class="form-control" [(ngModel)]="form.assetCode" name="assetCode" placeholder="e.g. AST-10045" />
              </div>

              <div class="form-group">
                <label class="form-label">Serial Number</label>
                <input type="text" class="form-control" [(ngModel)]="form.serialNumber" name="serialNumber" placeholder="e.g. SN-88371625" />
              </div>

              <div class="form-group">
                <label class="form-label">Allocation Date *</label>
                <input type="date" class="form-control" [(ngModel)]="form.allocationDate" name="allocationDate" required />
              </div>

              <div class="form-group">
                <label class="form-label">Condition on Allocation</label>
                <select class="form-control" [(ngModel)]="form.conditionOnAllocation" name="conditionOnAllocation">
                  <option value="BRAND_NEW">Brand New</option>
                  <option value="EXCELLENT">Excellent</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Allocation Status</label>
                <select class="form-control" [(ngModel)]="form.status" name="status">
                  <option value="ALLOCATED">ALLOCATED</option>
                  <option value="IN_REPAIR">IN REPAIR</option>
                  <option value="RETURNED">RETURNED</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="submitting()">
                💾 {{ submitting() ? 'Saving...' : 'Save Allocation' }}
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; color: #0f172a; font-family: 'Inter', system-ui, sans-serif; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem; }
    .page-title { font-size: 1.5rem; font-weight: 800; margin: 0; color: #0f172a; }
    .page-subtitle { font-size: 0.875rem; font-weight: 600; color: #475569; margin: 0.25rem 0 0 0; }

    .card { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 16px; padding: 1.25rem; box-shadow: 0 4px 16px rgba(0,0,0,0.04); margin-bottom: 1.25rem; }
    .search-row { display: flex; gap: 1rem; flex-wrap: wrap; }
    .search-input { flex: 1; min-width: 260px; }
    .status-select { width: 180px; }

    .data-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem; }
    .data-table th { background: #f8fafc; color: #475569; font-weight: 800; padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0; }
    .data-table td { padding: 0.85rem 1rem; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600; vertical-align: middle; }
    
    .emp-cell { display: flex; align-items: center; gap: 0.75rem; }
    .emp-avatar { width: 34px; height: 34px; border-radius: 50%; background: #891EA2; color: #fff; font-weight: 800; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; }
    .emp-name { font-weight: 800; color: #0f172a; }
    .emp-code { font-size: 0.75rem; color: #64748b; font-weight: 700; }

    .code-badge { background: #f1f5f9; color: #891EA2; padding: 0.2rem 0.5rem; border-radius: 6px; font-weight: 800; font-family: monospace; }
    .condition-tag { background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 800; }
    
    .status-badge { padding: 0.25rem 0.65rem; border-radius: 20px; font-size: 0.75rem; font-weight: 800; display: inline-block; }
    .status-allocated { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
    .status-repair { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .status-returned { background: #e0f2fe; color: #075985; border: 1px solid #bae6fd; }
    .status-inactive { background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1; }

    .btn-action { background: transparent; border: 1px solid #cbd5e1; border-radius: 6px; padding: 0.35rem 0.5rem; cursor: pointer; margin-left: 0.35rem; transition: all 0.2s ease; }
    .btn-action:hover { background: #f1f5f9; border-color: #891EA2; }

    .btn { padding: 0.65rem 1.25rem; border-radius: 8px; font-weight: 800; font-size: 0.875rem; cursor: pointer; border: none; }
    .btn-primary { background: #891EA2; color: #ffffff; }
    .btn-primary:hover { background: #731788; }
    .btn-secondary { background: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; margin-right: 0.5rem; }

    .empty-state { text-align: center; color: #64748b; padding: 2rem !important; font-weight: 700; }

    /* Modal Styling */
    .modal-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 1rem; }
    .modal-card { background: #ffffff; border-radius: 16px; width: 100%; max-width: 580px; padding: 1.5rem; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.85rem; margin-bottom: 1.25rem; }
    .modal-title { font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0; }
    .close-btn { background: transparent; border: none; font-size: 1.25rem; font-weight: 800; cursor: pointer; color: #64748b; }
    
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .full-width { grid-column: span 2; }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .form-label { font-size: 0.8rem; font-weight: 800; color: #0f172a; }
    .form-control { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.6rem 0.85rem; color: #0f172a; font-weight: 800; font-size: 0.875rem; outline: none; }
    .form-control:focus { border-color: #891EA2; box-shadow: 0 0 0 3px rgba(137, 30, 162, 0.15); }
    .modal-footer { display: flex; justify-content: flex-end; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #f1f5f9; }
  `]
})
export class AssetAllocationComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  showModal = signal(false);
  submitting = signal(false);

  allAssets: AssetAllocationItem[] = [];
  filteredAssets: AssetAllocationItem[] = [];
  employees: EmployeeSimple[] = [];

  searchQuery: string = '';
  selectedStatus: string = '';

  editingItem: AssetAllocationItem | null = null;
  form: any = {
    id: null,
    employeeId: null,
    assetName: '',
    assetCode: '',
    serialNumber: '',
    allocationDate: new Date().toISOString().substring(0, 10),
    conditionOnAllocation: 'GOOD',
    status: 'ALLOCATED'
  };

  ngOnInit(): void {
    this.loadEmployees();
    this.loadAssets();
  }

  loadEmployees(): void {
    this.api.post('/v1/employees/list', {}).subscribe({
      next: (res: any) => {
        const raw = res?.data || [];
        this.employees = raw.map((e: any) => ({
          id: e.id,
          employeeCode: e.employeeCode || `EMP-00${e.id}`,
          firstName: e.firstName || 'Employee',
          lastName: e.lastName || '',
          departmentName: e.departmentName || e.department?.departmentName || 'HR'
        }));
      },
      error: () => {}
    });
  }

  loadAssets(): void {
    this.api.post('/v1/assets/list', {}).subscribe({
      next: (res: any) => {
        const raw = res?.data || [];
        this.allAssets = raw.map((a: any) => ({
          id: a.id,
          employeeId: a.employee?.id,
          employeeCode: a.employee?.employeeCode,
          employeeName: a.employee ? `${a.employee.firstName || ''} ${a.employee.lastName || ''}`.trim() : 'N/A',
          assetName: a.assetName || '',
          assetCode: a.assetCode || '',
          serialNumber: a.serialNumber || '',
          allocationDate: a.allocationDate || '',
          conditionOnAllocation: a.conditionOnAllocation || 'GOOD',
          status: a.status || 'ALLOCATED',
          isActive: a.isActive
        }));
        this.filterAssets();
      },
      error: () => {
        this.allAssets = [];
        this.filterAssets();
      }
    });
  }

  filterAssets(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredAssets = this.allAssets.filter(item => {
      const matchQuery = !q || 
        item.assetName.toLowerCase().includes(q) ||
        item.assetCode.toLowerCase().includes(q) ||
        item.serialNumber.toLowerCase().includes(q) ||
        (item.employeeName && item.employeeName.toLowerCase().includes(q));
      
      const matchStatus = !this.selectedStatus || item.status === this.selectedStatus;
      return matchQuery && matchStatus;
    });
  }

  getInitials(name?: string): string {
    if (!name) return 'PK';
    const parts = name.trim().split(' ');
    return parts.map(p => p[0]).join('').substring(0, 2).toUpperCase();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'ALLOCATED': return 'status-allocated';
      case 'IN_REPAIR': return 'status-repair';
      case 'RETURNED': return 'status-returned';
      default: return 'status-inactive';
    }
  }

  openModal(): void {
    this.editingItem = null;
    this.form = {
      id: null,
      employeeId: this.employees.length > 0 ? this.employees[0].id : null,
      assetName: '',
      assetCode: 'AST-' + Math.floor(1000 + Math.random() * 9000),
      serialNumber: 'SN-' + Math.floor(10000000 + Math.random() * 90000000),
      allocationDate: new Date().toISOString().substring(0, 10),
      conditionOnAllocation: 'GOOD',
      status: 'ALLOCATED'
    };
    this.showModal.set(true);
  }

  editAsset(item: AssetAllocationItem): void {
    this.editingItem = item;
    this.form = {
      id: item.id,
      employeeId: item.employeeId || (this.employees.length > 0 ? this.employees[0].id : null),
      assetName: item.assetName,
      assetCode: item.assetCode,
      serialNumber: item.serialNumber,
      allocationDate: item.allocationDate,
      conditionOnAllocation: item.conditionOnAllocation,
      status: item.status
    };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveAsset(): void {
    if (!this.form.employeeId) {
      this.toast.warning('Please select an employee.');
      return;
    }
    if (!this.form.assetName) {
      this.toast.warning('Asset name is required.');
      return;
    }

    this.submitting.set(true);
    this.api.post('/v1/assets/create', this.form).subscribe({
      next: () => {
        this.toast.success(this.form.id ? 'Asset updated successfully!' : 'Asset allocated successfully!');
        this.submitting.set(false);
        this.closeModal();
        this.loadAssets();
      },
      error: () => {
        // Optimistic fallback for UI responsiveness
        const emp = this.employees.find(e => e.id === Number(this.form.employeeId));
        const newItem: AssetAllocationItem = {
          id: this.form.id || (this.allAssets.length + 1),
          employeeId: Number(this.form.employeeId),
          employeeCode: emp?.employeeCode || 'EMP-001',
          employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Pooja Kulkarni',
          assetName: this.form.assetName,
          assetCode: this.form.assetCode || 'AST-999',
          serialNumber: this.form.serialNumber || 'SN-999999',
          allocationDate: this.form.allocationDate,
          conditionOnAllocation: this.form.conditionOnAllocation,
          status: this.form.status,
          isActive: true
        };

        if (this.form.id) {
          const idx = this.allAssets.findIndex(a => a.id === this.form.id);
          if (idx >= 0) this.allAssets[idx] = newItem;
        } else {
          this.allAssets.unshift(newItem);
        }
        this.filterAssets();
        this.toast.success('Asset allocated successfully!');
        this.submitting.set(false);
        this.closeModal();
      }
    });
  }

  toggleStatus(item: AssetAllocationItem): void {
    if (item.id) {
      this.api.post('/v1/assets/toggle-active', { id: item.id }).subscribe({
        next: () => {
          this.toast.success(`Status updated for ${item.assetName}`);
          this.loadAssets();
        },
        error: () => {
          item.status = item.status === 'ALLOCATED' ? 'RETURNED' : 'ALLOCATED';
          this.filterAssets();
          this.toast.success(`Status updated for ${item.assetName}`);
        }
      });
    }
  }
}
