import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { encryptStorageData, decryptStorageData } from 'src/app/core/utils/crypto.utils';

export interface LookupTypeMaster {
  id: number;
  typeCode: string;
  typeName: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface LookupValueMaster {
  id: number;
  typeCode: string;
  valueCode: string;
  displayValue: string;
  status: 'ACTIVE' | 'INACTIVE';
}

@Component({
  selector: 'app-lookup-masters',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <!-- Toast Overlay -->
    <div class="toast-container" *ngIf="isToastVisible" [class]="'toast-' + toastType">
      <div class="toast-content">
        <span class="toast-icon" *ngIf="toastType === 'success'">✓</span>
        <span class="toast-icon" *ngIf="toastType === 'error'">✖</span>
        <span class="toast-text">{{ toastMessage }}</span>
      </div>
      <button class="toast-close" (click)="isToastVisible = false">&times;</button>
    </div>

    <!-- Main Header -->
    <div class="page-header mb-3">
      <div>
        <h1 class="page-title">⚙️ System Master Management</h1>
        <p class="page-subtitle">Configure 2-Level Master Definitions: Lookup Types (Category Master) and Lookup Values</p>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="tab-header mb-4">
      <button class="tab-btn" [class.active]="activeTab === 'types'" (click)="activeTab = 'types'">
        🗂️ 1. Lookup Type Master (Category Master)
      </button>
      <button class="tab-btn" [class.active]="activeTab === 'values'" (click)="activeTab = 'values'">
        🏷️ 2. Lookup Value Master (Values Master)
      </button>
    </div>

    <!-- TAB 1: LOOKUP TYPE MASTER -->
    <div *ngIf="activeTab === 'types'" class="glass-card">
      <div class="header-actions">
        <div class="title-group">
          <h2>🗂️ Lookup Type Master</h2>
          <p>Define master categories (e.g. GENDER, BLOOD_GROUP, MARITAL_STATUS, ACCOUNT_TYPE)</p>
        </div>
        <button class="btn-primary" (click)="openAddTypeModal()">
          <span>+</span> Add Lookup Type
        </button>
      </div>

      <div class="table-container" *ngIf="typeList.length > 0">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Type Code</th>
              <th>Type Name</th>
              <th>Description</th>
              <th>Total Values</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of typeList">
              <td><code class="code-pill">{{ t.typeCode }}</code></td>
              <td><strong>{{ t.typeName }}</strong></td>
              <td><span class="text-muted">{{ t.description }}</span></td>
              <td><span class="badge badge-button">{{ getValueCountForType(t.typeCode) }} Values</span></td>
              <td><span [class]="getBadgeClass(t.status)">{{ t.status }}</span></td>
              <td style="text-align: right;">
                <div class="action-btn-group">
                  <button class="btn-secondary sm" (click)="openEditTypeModal(t)">Edit</button>
                  <button class="btn-danger sm" (click)="deleteType(t.id)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="empty-state-box" *ngIf="typeList.length === 0">
        <div class="empty-icon">🗂️</div>
        <h3>No Lookup Types Configured</h3>
        <p>Click below to define master categories like GENDER, BLOOD_GROUP, or ACCOUNT_TYPE.</p>
        <button class="btn-primary mt-3" (click)="openAddTypeModal()">+ Add Lookup Type</button>
      </div>
    </div>

    <!-- TAB 2: LOOKUP VALUE MASTER -->
    <div *ngIf="activeTab === 'values'" class="glass-card">
      <div class="header-actions">
        <div class="title-group">
          <h2>🏷️ Lookup Value Master</h2>
          <p>Map dropdown options under specific Parent Lookup Types (e.g. Female under GENDER, B+ under BLOOD_GROUP)</p>
        </div>
        <button class="btn-primary" (click)="openAddValueModal()">
          <span>+</span> Add Lookup Value
        </button>
      </div>

      <div class="filter-toolbar mb-3">
        <label>Filter by Parent Lookup Type:</label>
        <select class="filter-select" [(ngModel)]="filterTypeCode">
          <option value="ALL">All Categories</option>
          <option *ngFor="let t of typeList" [value]="t.typeCode">{{ t.typeName }} ({{ t.typeCode }})</option>
        </select>
      </div>

      <div class="table-container" *ngIf="getFilteredValues().length > 0">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Parent Type</th>
              <th>Value Code</th>
              <th>Display Label / Value</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let v of getFilteredValues()">
              <td><span class="module-tag">{{ v.typeCode }}</span></td>
              <td><code class="code-pill">{{ v.valueCode }}</code></td>
              <td><strong>{{ v.displayValue }}</strong></td>
              <td><span [class]="getBadgeClass(v.status)">{{ v.status }}</span></td>
              <td style="text-align: right;">
                <div class="action-btn-group">
                  <button class="btn-secondary sm" (click)="openEditValueModal(v)">Edit</button>
                  <button class="btn-danger sm" (click)="deleteValue(v.id)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="empty-state-box" *ngIf="getFilteredValues().length === 0">
        <div class="empty-icon">🏷️</div>
        <h3>No Lookup Values Configured</h3>
        <p>Click below to add values under your Lookup Type categories.</p>
        <button class="btn-primary mt-3" (click)="openAddValueModal()">+ Add Lookup Value</button>
      </div>
    </div>

    <!-- MODAL 1: ADD / EDIT LOOKUP TYPE -->
    <div class="modal-backdrop" *ngIf="isTypeModalOpen">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ isEditMode ? 'Edit Lookup Type Master' : 'Add New Lookup Type Master' }}</h3>
          <button class="close-btn" (click)="isTypeModalOpen = false">&times;</button>
        </div>
        <form [formGroup]="typeForm" (ngSubmit)="saveType()">
          <div class="form-grid">
            <div class="form-group">
              <label>Type Code *</label>
              <input type="text" formControlName="typeCode" class="form-control" placeholder="e.g. GENDER, BLOOD_GROUP, MARITAL_STATUS" />
            </div>
            <div class="form-group">
              <label>Type Name *</label>
              <input type="text" formControlName="typeName" class="form-control" placeholder="e.g. Gender Options, Blood Group Master" />
            </div>
            <div class="form-group full-width">
              <label>Description</label>
              <input type="text" formControlName="description" class="form-control" placeholder="e.g. Master category for employee demographics" />
            </div>
            <div class="form-group">
              <label>Status</label>
              <select formControlName="status" class="form-control">
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
            <button type="button" class="btn-secondary" (click)="isTypeModalOpen = false">Cancel</button>
            <button type="submit" class="btn-primary" [disabled]="typeForm.invalid">Save Lookup Type</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 2: ADD / EDIT LOOKUP VALUE -->
    <div class="modal-backdrop" *ngIf="isValueModalOpen">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ isEditMode ? 'Edit Lookup Value Master' : 'Add New Lookup Value Master' }}</h3>
          <button class="close-btn" (click)="isValueModalOpen = false">&times;</button>
        </div>
        <form [formGroup]="valueForm" (ngSubmit)="saveValue()">
          <div class="form-grid">
            <div class="form-group">
              <label>Select Parent Lookup Type *</label>
              <select formControlName="typeCode" class="form-control">
                <option *ngFor="let t of typeList" [value]="t.typeCode">{{ t.typeName }} ({{ t.typeCode }})</option>
              </select>
            </div>

            <div class="form-group">
              <label>Value Code *</label>
              <input type="text" formControlName="valueCode" class="form-control" placeholder="e.g. MALE, B_POSITIVE, SAVINGS" />
            </div>

            <div class="form-group">
              <label>Display Label / Value *</label>
              <input type="text" formControlName="displayValue" class="form-control" placeholder="e.g. Male, B+, Savings Account" />
            </div>

            <div class="form-group">
              <label>Status</label>
              <select formControlName="status" class="form-control">
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
            <button type="button" class="btn-secondary" (click)="isValueModalOpen = false">Cancel</button>
            <button type="submit" class="btn-primary" [disabled]="valueForm.invalid">Save Lookup Value</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
  :host { display: block; padding: 1.5rem; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #0f172a; }
  .page-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0; }
  .page-subtitle { font-size: 0.875rem; color: #64748b; margin-top: 0.2rem; }

  .toast-container { position: fixed; top: 1.5rem; right: 1.5rem; z-index: 9999; display: flex; align-items: center; gap: 1rem; padding: 0.85rem 1.25rem; border-radius: 12px; backdrop-filter: blur(12px); box-shadow: 0 10px 25px rgba(0,0,0,0.15); font-size: 0.875rem; font-weight: 600; }
  .toast-success { background: #dcfce7; border: 1px solid #86efac; color: #15803d; }
  .toast-error { background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; }
  .toast-content { display: flex; align-items: center; gap: 0.6rem; }
  .toast-close { background: none; border: none; color: currentColor; font-size: 1.25rem; cursor: pointer; }

  .tab-header { display: flex; gap: 0.5rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; flex-wrap: wrap; }
  .tab-btn { background: #ffffff; border: 1px solid #cbd5e1; color: #475569; padding: 0.65rem 1.25rem; border-radius: 10px; font-size: 0.875rem; font-weight: 700; cursor: pointer; transition: all 0.2s ease; }
  .tab-btn:hover { background: #faf5ff; border-color: #891EA2; color: #891EA2; }
  .tab-btn.active { background: linear-gradient(135deg, #891EA2, #a855f7); color: #ffffff; border-color: #891EA2; box-shadow: 0 4px 15px rgba(137, 30, 162, 0.3); }

  .glass-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.5rem; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05); color: #0f172a; }
  .header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
  .title-group h2 { font-size: 1.4rem; font-weight: 800; margin: 0; color: #0f172a; }
  .title-group p { font-size: 0.875rem; color: #64748b; margin: 0.25rem 0 0 0; }

  .btn-primary { background: linear-gradient(135deg, #891EA2, #a855f7); color: #ffffff; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 700; font-size: 0.875rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.2s ease; box-shadow: 0 4px 14px rgba(137, 30, 162, 0.3); }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(137, 30, 162, 0.5); }
  .btn-secondary { background: #f1f5f9; color: #1e293b; border: 1px solid #cbd5e1; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all 0.2s ease; }
  .btn-secondary:hover { background: #e2e8f0; color: #000000; border-color: #94a3b8; }
  .btn-secondary.sm { padding: 0.35rem 0.75rem; font-size: 0.8rem; }
  .btn-danger { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: all 0.2s ease; }
  .btn-danger:hover { background: #fca5a5; color: #000000; }
  .btn-danger.sm { padding: 0.35rem 0.75rem; font-size: 0.8rem; }

  .action-btn-group { display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem; }

  .filter-toolbar { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; background: #f8fafc; padding: 0.75rem 1rem; border-radius: 10px; border: 1px solid #e2e8f0; }
  .filter-toolbar label { font-weight: 700; color: #475569; font-size: 0.85rem; }
  .filter-select { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 0.85rem; color: #0f172a; font-size: 0.85rem; font-weight: 600; outline: none; }

  .code-pill { background: #f3e8ff; color: #7e22ce; padding: 0.25rem 0.6rem; border-radius: 6px; font-family: monospace; font-size: 0.8rem; font-weight: 800; border: 1px solid #d8b4fe; }
  .module-tag { font-size: 0.78rem; font-weight: 800; color: #0369a1; background: #e0f2fe; padding: 0.25rem 0.6rem; border-radius: 6px; border: 1px solid #7dd3fc; }

  .table-container { overflow-x: auto; border-radius: 10px; border: 1px solid #e2e8f0; }
  .custom-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem; }
  .custom-table th { background: #f8fafc; color: #475569; font-weight: 700; padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
  .custom-table td { padding: 0.85rem 1rem; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
  .custom-table tbody tr:hover { background: rgba(137, 30, 162, 0.03); }

  .badge { padding: 0.3rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 800; display: inline-flex; align-items: center; gap: 0.3rem; }
  .badge-active { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
  .badge-inactive { background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1; }
  .badge-button { background: #f3e8ff; color: #7e22ce; border: 1px solid #e9d5ff; }

  .empty-state-box { text-align: center; padding: 4rem 1.5rem; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; margin-top: 1rem; color: #64748b; }
  .empty-state-box .empty-icon { font-size: 3rem; margin-bottom: 0.5rem; }
  .empty-state-box h3 { color: #0f172a; font-weight: 800; margin-bottom: 0.35rem; }
  .empty-state-box p { color: #64748b; font-size: 0.875rem; margin: 0; }

  .modal-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
  .modal-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; width: 90%; max-width: 600px; padding: 1.75rem; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18); color: #0f172a; }
  .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
  .modal-header h3 { margin: 0; font-size: 1.25rem; color: #0f172a; font-weight: 800; }
  .close-btn { background: none; border: none; color: #64748b; font-size: 1.5rem; cursor: pointer; }
  .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
  .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
  .form-group.full-width { grid-column: 1 / -1; }
  .form-group label { font-size: 0.8rem; font-weight: 800; color: #0f172a; }
  .form-control { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.6rem 0.85rem; color: #0f172a; font-size: 0.875rem; font-weight: 600; outline: none; }
  .form-control:focus { border-color: #891EA2; box-shadow: 0 0 0 3px rgba(137, 30, 162, 0.15); }
  `]
})
export class LookupMastersComponent implements OnInit {
  activeTab: 'types' | 'values' = 'types';

  typeList: LookupTypeMaster[] = [];
  valueList: LookupValueMaster[] = [];

  filterTypeCode: string = 'ALL';

  isTypeModalOpen: boolean = false;
  isValueModalOpen: boolean = false;
  isEditMode: boolean = false;
  selectedId: any = null;

  typeForm!: FormGroup;
  valueForm!: FormGroup;

  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';
  isToastVisible: boolean = false;

  constructor(private api: ApiService, private fb: FormBuilder, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.initForms();
    this.loadData();
    this.route.url.subscribe(url => {
      const path = url[0]?.path;
      if (path === 'lookup-values') {
        this.activeTab = 'values';
      } else if (path === 'lookup-types') {
        this.activeTab = 'types';
      }
    });
  }

  showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = msg;
    this.toastType = type;
    this.isToastVisible = true;
    setTimeout(() => { this.isToastVisible = false; }, 3500);
  }

  initForms(): void {
    this.typeForm = this.fb.group({
      typeCode: ['', Validators.required],
      typeName: ['', Validators.required],
      description: [''],
      status: ['ACTIVE', Validators.required]
    });

    this.valueForm = this.fb.group({
      typeCode: ['GENDER', Validators.required],
      valueCode: ['', Validators.required],
      displayValue: ['', Validators.required],
      status: ['ACTIVE', Validators.required]
    });
  }

  private getGroupedLookups(): any {
    const genders = this.valueList.filter(l => l.typeCode === 'GENDER' && l.status === 'ACTIVE').map(l => l.displayValue);
    const bloodGroups = this.valueList.filter(l => l.typeCode === 'BLOOD_GROUP' && l.status === 'ACTIVE').map(l => l.displayValue);
    const maritalStatuses = this.valueList.filter(l => l.typeCode === 'MARITAL_STATUS' && l.status === 'ACTIVE').map(l => l.displayValue);
    const accountTypes = this.valueList.filter(l => l.typeCode === 'ACCOUNT_TYPE' && l.status === 'ACTIVE').map(l => l.displayValue);
    return { genders, bloodGroups, maritalStatuses, accountTypes };
  }

  private persistState(): void {
    try {
      sessionStorage.setItem('hrms_lookup_types', encryptStorageData(JSON.stringify(this.typeList)));
      sessionStorage.setItem('hrms_lookup_values', encryptStorageData(JSON.stringify(this.valueList)));
      sessionStorage.setItem('hrms_lookups', encryptStorageData(JSON.stringify(this.getGroupedLookups())));
    } catch {}
  }

  private restoreState(): boolean {
    try {
      const tStr = decryptStorageData(sessionStorage.getItem('hrms_lookup_types'));
      const vStr = decryptStorageData(sessionStorage.getItem('hrms_lookup_values'));
      if (tStr && vStr) {
        this.typeList = JSON.parse(tStr);
        this.valueList = JSON.parse(vStr);
        return true;
      }
    } catch {}
    return false;
  }

  loadData(): void {
    this.restoreState();

    this.api.post('/v1/masters/lookup-types/list', {}).subscribe({
      next: (res: any) => {
        if (res && res.data && Array.isArray(res.data)) {
          this.typeList = res.data;
          this.persistState();
        }
      },
      error: (err: any) => {
        // If API fails and session storage is empty, do not show hardcoded values
      }
    });

    this.api.post('/v1/masters/lookup-values/list', {}).subscribe({
      next: (res: any) => {
        if (res && res.data && Array.isArray(res.data)) {
          this.valueList = res.data;
          this.persistState();
        }
      },
      error: (err: any) => {
        // If API fails and session storage is empty, do not show hardcoded values
      }
    });
  }

  getValueCountForType(typeCode: string): number {
    return this.valueList.filter(v => v.typeCode === typeCode).length;
  }

  getFilteredValues(): LookupValueMaster[] {
    if (!this.filterTypeCode || this.filterTypeCode === 'ALL') return this.valueList;
    return this.valueList.filter(v => v.typeCode === this.filterTypeCode);
  }

  // Type Master Modals
  openAddTypeModal(): void {
    this.isEditMode = false;
    this.selectedId = null;
    this.typeForm.reset({ status: 'ACTIVE' });
    this.isTypeModalOpen = true;
  }

  openEditTypeModal(t: LookupTypeMaster): void {
    this.isEditMode = true;
    this.selectedId = t.id;
    this.typeForm.patchValue(t);
    this.isTypeModalOpen = true;
  }

  saveType(): void {
    if (this.typeForm.invalid) return;
    const val = { ...this.typeForm.value, id: this.selectedId || Date.now() };

    this.api.post('/v1/masters/lookup-types/save', val).subscribe({
      next: (res: any) => {
        if (this.isEditMode) {
          const idx = this.typeList.findIndex(t => t.id === this.selectedId);
          if (idx !== -1) this.typeList[idx] = val;
        } else {
          if (res && res.data && res.data.id) val.id = res.data.id;
          this.typeList.push(val);
        }
        this.persistState();
        this.isTypeModalOpen = false;
        this.showToast(res?.message || 'Lookup Type master saved successfully!', 'success');
      },
      error: (err: any) => {
        if (this.isEditMode) {
          const idx = this.typeList.findIndex(t => t.id === this.selectedId);
          if (idx !== -1) this.typeList[idx] = val;
        } else {
          this.typeList.push(val);
        }
        this.persistState();
        this.isTypeModalOpen = false;
        const errorMsg = err?.error?.message || err?.message || 'Backend server note';
        this.showToast(`Saved locally! Backend API Note: ${errorMsg}`, 'error');
      }
    });
  }

  deleteType(id: number): void {
    if (confirm('Delete this Lookup Type master? All associated values will also be deleted.')) {
      const typeItem = this.typeList.find(t => t.id === id);
      this.api.post('/v1/masters/lookup-types/delete', { id }).subscribe({
        next: (res: any) => {
          this.typeList = this.typeList.filter(t => t.id !== id);
          if (typeItem) this.valueList = this.valueList.filter(v => v.typeCode !== typeItem.typeCode);
          this.persistState();
          this.showToast(res?.message || 'Lookup Type deleted successfully.', 'success');
        },
        error: (err: any) => {
          this.typeList = this.typeList.filter(t => t.id !== id);
          if (typeItem) this.valueList = this.valueList.filter(v => v.typeCode !== typeItem.typeCode);
          this.persistState();
          const errorMsg = err?.error?.message || err?.message || 'Server error';
          this.showToast(`Deleted locally! Backend API Note: ${errorMsg}`, 'error');
        }
      });
    }
  }

  // Value Master Modals
  openAddValueModal(): void {
    this.isEditMode = false;
    this.selectedId = null;
    const firstType = this.typeList[0]?.typeCode || 'GENDER';
    this.valueForm.reset({ typeCode: firstType, status: 'ACTIVE' });
    this.isValueModalOpen = true;
  }

  openEditValueModal(v: LookupValueMaster): void {
    this.isEditMode = true;
    this.selectedId = v.id;
    this.valueForm.patchValue(v);
    this.isValueModalOpen = true;
  }

  saveValue(): void {
    if (this.valueForm.invalid) return;
    const val = { ...this.valueForm.value, id: this.selectedId || Date.now() };

    this.api.post('/v1/masters/lookup-values/save', val).subscribe({
      next: (res: any) => {
        if (this.isEditMode) {
          const idx = this.valueList.findIndex(v => v.id === this.selectedId);
          if (idx !== -1) this.valueList[idx] = val;
        } else {
          if (res && res.data && res.data.id) val.id = res.data.id;
          this.valueList.push(val);
        }
        this.persistState();
        this.isValueModalOpen = false;
        this.showToast(res?.message || 'Lookup Value master saved successfully!', 'success');
      },
      error: (err: any) => {
        if (this.isEditMode) {
          const idx = this.valueList.findIndex(v => v.id === this.selectedId);
          if (idx !== -1) this.valueList[idx] = val;
        } else {
          this.valueList.push(val);
        }
        this.persistState();
        this.isValueModalOpen = false;
        const errorMsg = err?.error?.message || err?.message || 'Backend server note';
        this.showToast(`Saved locally! Backend API Note: ${errorMsg}`, 'error');
      }
    });
  }

  deleteValue(id: number): void {
    if (confirm('Delete this Lookup Value master entry?')) {
      this.api.post('/v1/masters/lookup-values/delete', { id }).subscribe({
        next: (res: any) => {
          this.valueList = this.valueList.filter(v => v.id !== id);
          this.persistState();
          this.showToast(res?.message || 'Lookup Value deleted successfully.', 'success');
        },
        error: (err: any) => {
          this.valueList = this.valueList.filter(v => v.id !== id);
          this.persistState();
          const errorMsg = err?.error?.message || err?.message || 'Server error';
          this.showToast(`Deleted locally! Backend API Note: ${errorMsg}`, 'error');
        }
      });
    }
  }

  getBadgeClass(status: string): string {
    return String(status || '').toUpperCase().includes('ACTIVE') ? 'badge badge-active' : 'badge badge-inactive';
  }
}
