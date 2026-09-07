import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';

export interface LeaveTypeMaster {
  id?: number | string;
  typeCode: string;
  typeName: string;
  maxDaysPerYear?: number;
}

@Component({
  selector: 'app-leave-balances',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="glass-card">
      <div class="header-actions">
        <div class="title-group">
          <h2>Leave Balances Master</h2>
          <p>Dynamic leave balance allocations fetched directly from Leave Type Master</p>
        </div>
        <button class="btn-primary" (click)="openAddModal()">
          <span>+</span> Add New Balance Record
        </button>
      </div>

      <div class="search-box">
        <input
          type="text"
          class="search-input"
          placeholder="Search by Emp Code, Name, or Leave Type..."
          [(ngModel)]="searchQuery"
          (input)="filterRecords()"
        />
        <button class="btn-secondary" (click)="loadAllData()">🔄 Refresh</button>
      </div>

      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Emp Code</th>
              <th>Employee Name</th>
              <!-- Dynamic Headers for each Leave Type added in Leave Type Master -->
              <th *ngFor="let lt of leaveTypes">
                {{ lt.typeName }} ({{ lt.typeCode }})
              </th>
              <th>Total Remaining Days</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of filteredEmployeeRows">
              <td><strong>{{ row.employeeCode }}</strong></td>
              <td><strong>{{ row.employeeName }}</strong></td>
              <!-- Dynamic Balance values per Leave Type -->
              <td *ngFor="let lt of leaveTypes">
                <span class="quota-pill">
                  {{ getEmployeeLeaveQuota(row, lt) }} Days
                </span>
              </td>
              <td>
                <span class="badge badge-active">
                  {{ getEmployeeTotalRemaining(row) }} Days
                </span>
              </td>
              <td style="text-align: right;">
                <button class="btn-secondary" style="margin-right: 0.5rem;" (click)="openEditModal(row)">Edit</button>
                <button class="btn-danger" (click)="promptDeleteRecord(row)">Delete</button>
              </td>
            </tr>
            <tr *ngIf="filteredEmployeeRows.length === 0">
              <td [attr.colspan]="leaveTypes.length + 4" class="empty-state">
                No leave balance records found. Click "+ Add New Balance Record" to create one.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div class="modal-backdrop" *ngIf="isModalOpen">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ isEditMode ? 'Edit Employee Leave Balances' : 'Create New Leave Balance Record' }}</h3>
          <button class="close-btn" (click)="closeModal()">&times;</button>
        </div>

        <form (ngSubmit)="saveRecord()">
          <div class="form-grid">
            
            <!-- Employee Selection Dropdown -->
            <div class="form-group full-width">
              <label for="employeeSelect">Select Employee</label>
              <select id="employeeSelect" class="form-control select-dropdown" 
                      [(ngModel)]="selectedEmployeeId" 
                      [ngModelOptions]="{standalone: true}"
                      (change)="onEmployeeSelect($event)">
                <option value="">-- Choose Employee --</option>
                <option *ngFor="let emp of employees" [value]="emp.id">
                  {{ emp.employeeCode }} - {{ emp.firstName }} {{ emp.lastName }} {{ emp.department?.departmentName ? '(' + emp.department.departmentName + ')' : '' }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="employeeCode">Emp Code</label>
              <input id="employeeCode" type="text" [(ngModel)]="formEmployeeCode" [ngModelOptions]="{standalone: true}" class="form-control" placeholder="EMP-001" />
            </div>

            <div class="form-group">
              <label for="employeeName">Employee Name</label>
              <input id="employeeName" type="text" [(ngModel)]="formEmployeeName" [ngModelOptions]="{standalone: true}" class="form-control" placeholder="Full Employee Name" />
            </div>

            <!-- Dynamic Input Fields for ALL Leave Types configured in Leave Type Master -->
            <div class="form-group" *ngFor="let lt of leaveTypes">
              <label [for]="'lt_input_' + getLeaveTypeKey(lt)">
                {{ lt.typeName }} ({{ lt.typeCode }})
              </label>
              <input 
                [id]="'lt_input_' + getLeaveTypeKey(lt)"
                type="number" 
                min="0" 
                class="form-control"
                [ngModel]="dynamicBalances[getLeaveTypeKey(lt)]"
                (ngModelChange)="onBalanceChange(getLeaveTypeKey(lt), $event)"
                [ngModelOptions]="{standalone: true}"
                [placeholder]="'Default: ' + (lt.maxDaysPerYear || 12)" 
              />
            </div>

            <div class="form-group full-width">
              <label for="totalBalance">Total Remaining Days (Calculated Automatically)</label>
              <input id="totalBalance" type="number" [value]="totalRemainingSum" class="form-control readonly-input" readonly />
            </div>
          </div>

          <div class="modal-footer-actions">
            <button type="button" class="btn-secondary" (click)="closeModal()">Cancel</button>
            <button type="submit" class="btn-primary" [disabled]="!formEmployeeCode || !formEmployeeName">
              💾 {{ isEditMode ? 'Update Balances' : 'Save Balances to Database' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Custom Glassmorphic Confirm Delete Modal -->
    <div class="modal-backdrop" *ngIf="isConfirmModalOpen">
      <div class="modal-card confirm-modal">
        <div class="modal-header">
          <h3>Confirm Action</h3>
          <button class="close-btn" (click)="closeConfirmModal()">&times;</button>
        </div>
        <div class="modal-body">
          <p>{{ confirmModalMessage }}</p>
        </div>
        <div class="modal-footer-actions mt-4">
          <button class="btn-secondary" (click)="closeConfirmModal()">Cancel</button>
          <button class="btn-danger" (click)="executeConfirmAction()">Yes, Delete</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding: 1.5rem;
      font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
      color: #0f172a !important;
    }
    .glass-card {
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    }
    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .title-group h2 {
      font-size: 1.5rem;
      font-weight: 800 !important;
      margin: 0;
      color: #0f172a !important;
    }
    .title-group p {
      font-size: 0.875rem;
      font-weight: 700 !important;
      color: #0f172a !important;
      margin: 0.25rem 0 0 0;
    }
    .btn-primary {
      background: #891EA2;
      color: #ffffff !important;
      border: none;
      padding: 0.65rem 1.25rem;
      border-radius: 8px;
      font-weight: 800 !important;
      font-size: 0.875rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
      box-shadow: 0 4px 14px rgba(137, 30, 162, 0.3);
    }
    .btn-primary:hover {
      background: #731788;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: #f1f5f9;
      color: #0f172a !important;
      border: 1px solid #cbd5e1;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 800 !important;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-secondary:hover {
      background: #e2e8f0;
    }
    .btn-danger {
      background: #fee2e2;
      color: #991b1b !important;
      border: 1px solid #fca5a5;
      padding: 0.45rem 0.9rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 800 !important;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-danger:hover {
      background: #fca5a5;
      color: #7f1d1d !important;
    }
    .search-box {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
      align-items: center;
    }
    .search-input {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 0.6rem 1rem;
      color: #0f172a !important;
      font-size: 0.875rem;
      font-weight: 800 !important;
      width: 100%;
      max-width: 360px;
      outline: none;
    }
    .search-input:focus {
      border-color: #891EA2;
      box-shadow: 0 0 0 3px rgba(137, 30, 162, 0.15);
    }
    .table-container {
      overflow-x: auto;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
    }
    .custom-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;
    }
    .custom-table th {
      background: #f8fafc;
      color: #0f172a !important;
      font-weight: 800 !important;
      padding: 0.85rem 1rem;
      border-bottom: 2px solid #e2e8f0;
      white-space: nowrap;
    }
    .custom-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      color: #0f172a !important;
      font-weight: 700 !important;
      white-space: nowrap;
    }
    .custom-table tbody tr:hover {
      background: #fdf4ff;
    }
    .quota-pill {
      background: #f1f5f9;
      color: #0f172a !important;
      font-weight: 800 !important;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
    }
    .badge {
      padding: 0.3rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 800 !important;
      display: inline-block;
    }
    .badge-active { background: #dcfce7; color: #0f172a !important; border: 1px solid #86efac; }
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      width: 90%;
      max-width: 620px;
      padding: 1.75rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      max-height: 90vh;
      overflow-y: auto;
    }
    .confirm-modal {
      max-width: 440px;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    .modal-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 800 !important;
      color: #0f172a !important;
    }
    .close-btn {
      background: none;
      border: none;
      color: #0f172a !important;
      font-size: 1.5rem;
      font-weight: 800 !important;
      cursor: pointer;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .full-width {
      grid-column: 1 / -1;
    }
    .form-group label {
      font-size: 0.825rem;
      font-weight: 800 !important;
      color: #0f172a !important;
    }
    .form-control {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 0.6rem 0.85rem;
      color: #0f172a !important;
      font-weight: 800 !important;
      font-size: 0.875rem;
      outline: none;
    }
    .select-dropdown {
      cursor: pointer;
      background-color: #f8fafc;
    }
    .readonly-input {
      background: #f1f5f9;
      cursor: not-allowed;
    }
    .form-control:focus {
      border-color: #891EA2;
      box-shadow: 0 0 0 3px rgba(137, 30, 162, 0.15);
    }
    .modal-footer-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
    .modal-body p {
      font-size: 0.95rem;
      font-weight: 700 !important;
      color: #0f172a !important;
      margin: 0;
    }
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: #0f172a !important;
      font-weight: 700 !important;
    }
  `]
})
export class LeaveBalancesComponent implements OnInit {
  // Master lists
  leaveTypes: LeaveTypeMaster[] = [];
  employees: any[] = [];
  rawLeaveBalances: any[] = [];

  // Grouped rows per employee
  employeeRows: any[] = [];
  filteredEmployeeRows: any[] = [];

  searchQuery: string = '';
  isModalOpen: boolean = false;
  isEditMode: boolean = false;

  // Modal Form State
  selectedEmployeeId: string = '';
  formEmployeeCode: string = '';
  formEmployeeName: string = '';
  dynamicBalances: { [key: string]: number } = {};
  totalRemainingSum: number = 0;

  // Custom Confirm Modal State
  isConfirmModalOpen: boolean = false;
  confirmModalMessage: string = '';
  pendingConfirmAction: (() => void) | null = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    // SINGLE Backend API call: All logic and data aggregation handled on Java side
    this.api.post('/v1/leave/balances/master-data', {}).subscribe({
      next: (res: any) => {
        const data = res?.data || {};
        const typesFromApi = data.leaveTypes || [];
        this.leaveTypes = typesFromApi;
        this.employees = data.employees || [];
        this.rawLeaveBalances = data.balances || [];
        this.buildGroupedEmployeeRows();
      },
      error: () => {
        if (!this.leaveTypes) {
          this.leaveTypes = [];
        }
        this.buildGroupedEmployeeRows();
      }
    });
  }

  buildGroupedEmployeeRows(): void {
    const mapByEmpCode: { [key: string]: any } = {};

    // First populate from registered employees
    this.employees.forEach(emp => {
      const code = emp.employeeCode || `EMP-${emp.id}`;
      mapByEmpCode[code] = {
        employeeId: emp.id,
        employeeCode: code,
        employeeName: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.officialEmail,
        balances: {}
      };
    });

    // Populate balances from rawLeaveBalances
    this.rawLeaveBalances.forEach(lb => {
      let code = lb.employeeCode;
      let name = lb.employeeName;
      let empId = lb.employeeId;

      if (lb.employee) {
        code = lb.employee.employeeCode || code;
        name = `${lb.employee.firstName || ''} ${lb.employee.lastName || ''}`.trim() || name;
        empId = lb.employee.id || empId;
      }

      if (!code) code = 'EMP-SYS';
      if (!mapByEmpCode[code]) {
        mapByEmpCode[code] = {
          employeeId: empId,
          employeeCode: code,
          employeeName: name || 'Employee',
          balances: {}
        };
      }

      if (lb.leaveType) {
        const key = lb.leaveType.id || lb.leaveType.typeCode || lb.leaveType.typeName;
        mapByEmpCode[code].balances[key] = lb.remainingDays ?? lb.allocatedDays ?? 0;
        mapByEmpCode[code].balances[lb.leaveType.typeCode] = lb.remainingDays ?? lb.allocatedDays ?? 0;
      } else if (lb.casualLeave !== undefined) {
        mapByEmpCode[code].balances['CL'] = lb.casualLeave;
        mapByEmpCode[code].balances['SL'] = lb.sickLeave;
        mapByEmpCode[code].balances['PL'] = lb.earnedLeave;
      }
    });

    this.employeeRows = Object.values(mapByEmpCode);
    this.filterRecords();
  }

  getLeaveTypeKey(lt: LeaveTypeMaster): string {
    if (lt && lt.id !== undefined && lt.id !== null) {
      return String(lt.id);
    }
    return (lt && lt.typeCode) ? String(lt.typeCode) : 'TYPE_KEY';
  }

  getEmployeeLeaveQuota(row: any, lt: LeaveTypeMaster): number {
    if (!row || !row.balances) return lt.maxDaysPerYear || 12;
    const keyId: string = (lt && lt.id !== undefined && lt.id !== null) ? String(lt.id) : '';
    const keyCode: string = (lt && lt.typeCode) ? String(lt.typeCode) : '';
    const keyName: string = (lt && lt.typeName) ? String(lt.typeName) : '';

    if (keyId !== '' && row.balances[keyId] !== undefined) return Number(row.balances[keyId]);
    if (keyCode !== '' && row.balances[keyCode] !== undefined) return Number(row.balances[keyCode]);
    if (keyName !== '' && row.balances[keyName] !== undefined) return Number(row.balances[keyName]);

    return lt.maxDaysPerYear || 12;
  }

  getEmployeeTotalRemaining(row: any): number {
    let sum = 0;
    this.leaveTypes.forEach(lt => {
      sum += this.getEmployeeLeaveQuota(row, lt);
    });
    return sum;
  }

  filterRecords(): void {
    if (!this.searchQuery.trim()) {
      this.filteredEmployeeRows = [...this.employeeRows];
      return;
    }
    const q = this.searchQuery.toLowerCase();
    this.filteredEmployeeRows = this.employeeRows.filter(row =>
      String(row.employeeCode).toLowerCase().includes(q) ||
      String(row.employeeName).toLowerCase().includes(q)
    );
  }

  onEmployeeSelect(event: any): void {
    const selectedEmpId = event.target.value;
    if (!selectedEmpId) return;
    const emp = this.employees.find(e => String(e.id) === String(selectedEmpId));
    if (emp) {
      this.formEmployeeCode = emp.employeeCode || `EMP-${emp.id}`;
      this.formEmployeeName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.officialEmail;

      // Populate existing balances for this employee if available
      const existingRow = this.employeeRows.find(r => r.employeeCode === this.formEmployeeCode || String(r.employeeId) === String(emp.id));
      if (existingRow) {
        this.leaveTypes.forEach(lt => {
          const k = this.getLeaveTypeKey(lt);
          this.dynamicBalances[k] = this.getEmployeeLeaveQuota(existingRow, lt);
        });
      } else {
        this.leaveTypes.forEach(lt => {
          const k = this.getLeaveTypeKey(lt);
          this.dynamicBalances[k] = lt.maxDaysPerYear || 12;
        });
      }
      this.recalculateTotal();
    }
  }

  onBalanceChange(key: any, value: any): void {
    if (key) {
      this.dynamicBalances[String(key)] = Number(value || 0);
      this.recalculateTotal();
    }
  }

  recalculateTotal(): void {
    let sum = 0;
    this.leaveTypes.forEach(lt => {
      const k = this.getLeaveTypeKey(lt);
      sum += Number(this.dynamicBalances[k] || 0);
    });
    this.totalRemainingSum = sum;
  }

  openAddModal(): void {
    this.closeAllModals();
    this.isEditMode = false;
    this.selectedEmployeeId = '';
    this.formEmployeeCode = '';
    this.formEmployeeName = '';
    this.dynamicBalances = {};

    this.leaveTypes.forEach(lt => {
      const k = this.getLeaveTypeKey(lt);
      this.dynamicBalances[k] = lt.maxDaysPerYear || 12;
    });

    this.recalculateTotal();
    this.isModalOpen = true;
  }

  openEditModal(row: any): void {
    this.closeAllModals();
    this.isEditMode = true;
    this.selectedEmployeeId = row.employeeId ? String(row.employeeId) : '';
    this.formEmployeeCode = row.employeeCode;
    this.formEmployeeName = row.employeeName;
    this.dynamicBalances = {};

    this.leaveTypes.forEach(lt => {
      const k = this.getLeaveTypeKey(lt);
      this.dynamicBalances[k] = this.getEmployeeLeaveQuota(row, lt);
    });

    this.recalculateTotal();
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveRecord(): void {
    if (!this.formEmployeeCode || !this.formEmployeeName) return;

    const payload = {
      employeeId: this.selectedEmployeeId || null,
      employeeCode: this.formEmployeeCode,
      employeeName: this.formEmployeeName,
      year: new Date().getFullYear(),
      balances: this.dynamicBalances
    };

    // Save batch to backend PostgreSQL database
    this.api.post('/v1/leave/balances/save-employee-balances', payload).subscribe({
      next: () => {
        this.loadAllData();
        this.closeModal();
      },
      error: () => {
        // Optimistic local update
        let existing = this.employeeRows.find(r => r.employeeCode === this.formEmployeeCode);
        if (!existing) {
          existing = {
            employeeId: this.selectedEmployeeId,
            employeeCode: this.formEmployeeCode,
            employeeName: this.formEmployeeName,
            balances: {}
          };
          this.employeeRows.push(existing);
        }
        existing.balances = { ...this.dynamicBalances };
        this.filterRecords();
        this.closeModal();
      }
    });
  }

  promptDeleteRecord(row: any): void {
    this.openConfirmDialog(
      `Are you sure you want to clear/delete leave balance record for ${row.employeeName} (${row.employeeCode})?`,
      () => {
        this.api.post('/v1/leave/balances/delete', { employeeCode: row.employeeCode, id: row.employeeId }).subscribe({
          next: () => this.loadAllData(),
          error: () => {
            this.employeeRows = this.employeeRows.filter(r => r.employeeCode !== row.employeeCode);
            this.filterRecords();
          }
        });
      }
    );
  }

  // ── Custom Glassmorphic Confirm Modal Handlers ──────────────────
  closeAllModals(): void {
    this.isModalOpen = false;
    this.isConfirmModalOpen = false;
  }

  openConfirmDialog(message: string, action: () => void): void {
    this.closeAllModals();
    this.confirmModalMessage = message;
    this.pendingConfirmAction = action;
    this.isConfirmModalOpen = true;
  }

  closeConfirmModal(): void {
    this.isConfirmModalOpen = false;
    this.pendingConfirmAction = null;
  }

  executeConfirmAction(): void {
    if (this.pendingConfirmAction) {
      this.pendingConfirmAction();
    }
    this.closeConfirmModal();
  }
}
