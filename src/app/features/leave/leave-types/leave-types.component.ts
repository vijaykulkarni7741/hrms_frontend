import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-leave-types',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="glass-card">
      <div class="header-actions">
        <div class="title-group">
          <h2>Leave Types Configuration</h2>
          <p>Configure company-wide leave policies and annual entitlement quotas</p>
        </div>
        <button class="btn-primary" (click)="openAddModal()">
          <span>+</span> Add Leave Type
        </button>
      </div>

      <div class="search-box">
        <input
          type="text"
          class="search-input"
          placeholder="Search by Code or Name..."
          [(ngModel)]="searchQuery"
          (input)="filterRecords()"
        />
        <button class="btn-secondary" (click)="loadRecords()">🔄 Refresh</button>
      </div>

      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Type Code</th>
              <th>Type Name</th>
              <th>Max Days/Yr</th>
              <th>Carry Forward</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of filteredItems">
              <td><strong>{{ item.typeCode }}</strong></td>
              <td><strong>{{ item.typeName }}</strong></td>
              <td>{{ item.maxDaysPerYear }} Days</td>
              <td>{{ item.isCarryForwardAllowed ? 'YES' : 'NO' }}</td>
              <td><span [class]="getBadgeClass(item.status)">{{ item.status || 'ACTIVE' }}</span></td>
              <td style="text-align: right;">
                <button class="btn-secondary" style="margin-right: 0.5rem;" (click)="openEditModal(item)">Edit</button>
                <button class="btn-danger" (click)="promptDeleteRecord(item)">Delete</button>
              </td>
            </tr>
            <tr *ngIf="filteredItems.length === 0">
              <td colspan="6" class="empty-state">
                No leave types configured. Click "+ Add Leave Type" to create one.
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
          <h3>{{ isEditMode ? 'Edit Leave Type' : 'Create New Leave Type' }}</h3>
          <button class="close-btn" (click)="closeModal()">&times;</button>
        </div>
        <form [formGroup]="recordForm" (ngSubmit)="saveRecord()">
          <div class="form-grid">
            <div class="form-group">
              <label for="typeCode">Type Code</label>
              <input id="typeCode" type="text" formControlName="typeCode" class="form-control" placeholder="e.g. CL" />
            </div>
            <div class="form-group">
              <label for="typeName">Type Name</label>
              <input id="typeName" type="text" formControlName="typeName" class="form-control" placeholder="e.g. Casual Leave" />
            </div>
            <div class="form-group">
              <label for="maxDaysPerYear">Max Days / Year</label>
              <input id="maxDaysPerYear" type="number" min="1" formControlName="maxDaysPerYear" class="form-control" placeholder="12" />
            </div>
            <div class="form-group">
              <label for="isCarryForwardAllowed">Carry Forward</label>
              <select id="isCarryForwardAllowed" formControlName="isCarryForwardAllowed" class="form-control">
                <option [ngValue]="true">YES (Allowed)</option>
                <option [ngValue]="false">NO (Lapses)</option>
              </select>
            </div>
            <div class="form-group">
              <label for="status">Status</label>
              <select id="status" formControlName="status" class="form-control">
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>
          <div class="modal-footer-actions">
            <button type="button" class="btn-secondary" (click)="closeModal()">Cancel</button>
            <button type="submit" class="btn-primary" [disabled]="recordForm.invalid">
              {{ isEditMode ? 'Update Type' : 'Save Type' }}
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
    }
    .custom-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      color: #0f172a !important;
      font-weight: 700 !important;
    }
    .custom-table tbody tr:hover {
      background: #fdf4ff;
    }
    .badge {
      padding: 0.3rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 800 !important;
      display: inline-block;
    }
    .badge-active { background: #dcfce7; color: #0f172a !important; border: 1px solid #86efac; }
    .badge-inactive { background: #f1f5f9; color: #0f172a !important; border: 1px solid #cbd5e1; }
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
      max-width: 580px;
      padding: 1.75rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
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
export class LeaveTypesComponent implements OnInit {
  items: any[] = [];
  filteredItems: any[] = [];
  searchQuery: string = '';
  isModalOpen: boolean = false;
  isEditMode: boolean = false;
  selectedId: any = null;
  recordForm!: FormGroup;

  // Custom Glassmorphic Confirm Modal State
  isConfirmModalOpen: boolean = false;
  confirmModalMessage: string = '';
  pendingConfirmAction: (() => void) | null = null;

  constructor(private api: ApiService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
    this.loadRecords();
  }

  initForm(): void {
    this.recordForm = this.fb.group({
      typeCode: ['', Validators.required],
      typeName: ['', Validators.required],
      maxDaysPerYear: [12, [Validators.required, Validators.min(1)]],
      isCarryForwardAllowed: [true, Validators.required],
      status: ['ACTIVE', Validators.required]
    });
  }

  loadRecords(): void {
    this.api.post('/v1/leave/types/list', {}).subscribe({
      next: (res: any) => {
        this.items = (res?.data && Array.isArray(res.data)) ? res.data : (res && Array.isArray(res)) ? res : [];
        this.filterRecords();
      },
      error: () => {
        this.items = [];
        this.filterRecords();
      }
    });
  }

  filterRecords(): void {
    if (!this.searchQuery.trim()) {
      this.filteredItems = [...this.items];
      return;
    }
    const q = this.searchQuery.toLowerCase();
    this.filteredItems = this.items.filter(item =>
      Object.values(item).some(val => String(val).toLowerCase().includes(q))
    );
  }

  openAddModal(): void {
    this.closeAllModals();
    this.isEditMode = false;
    this.selectedId = null;
    this.recordForm.reset({
      typeCode: '',
      typeName: '',
      maxDaysPerYear: 12,
      isCarryForwardAllowed: true,
      status: 'ACTIVE'
    });
    this.isModalOpen = true;
  }

  openEditModal(item: any): void {
    this.closeAllModals();
    this.isEditMode = true;
    this.selectedId = item.id;
    this.recordForm.patchValue({
      typeCode: item.typeCode,
      typeName: item.typeName,
      maxDaysPerYear: item.maxDaysPerYear,
      isCarryForwardAllowed: item.isCarryForwardAllowed === true || String(item.isCarryForwardAllowed).toUpperCase() === 'YES',
      status: item.status || 'ACTIVE'
    });
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveRecord(): void {
    if (this.recordForm.invalid) return;
    const payloadId = (this.selectedId !== null && this.selectedId !== undefined && !isNaN(Number(this.selectedId))) ? Number(this.selectedId) : null;
    const payload = { ...this.recordForm.value, id: payloadId };
    const endpoint = this.isEditMode ? '/v1/leave/types/update' : '/v1/leave/types/create';
    this.api.post(endpoint, payload).subscribe({
      next: (res: any) => {
        this.loadRecords();
        this.closeModal();
      },
      error: () => {
        if (this.isEditMode) {
          const idx = this.items.findIndex(i => i.id === this.selectedId);
          if (idx !== -1) this.items[idx] = { ...payload };
        } else {
          this.items.push({ ...payload, id: Date.now().toString() });
        }
        this.filterRecords();
        this.closeModal();
      }
    });
  }

  promptDeleteRecord(item: any): void {
    this.openConfirmDialog(
      `Are you sure you want to delete leave type "${item.typeName}" (${item.typeCode})?`,
      () => {
        this.api.post('/v1/leave/types/delete', { id: item.id }).subscribe({
          next: () => this.loadRecords(),
          error: () => {
            this.items = this.items.filter(i => i.id !== item.id);
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

  getBadgeClass(status: string): string {
    const s = String(status || '').toUpperCase();
    if (s.includes('ACTIVE') || s.includes('APPROVED')) return 'badge badge-active';
    return 'badge badge-inactive';
  }
}
