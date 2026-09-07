import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';
import { PaginationComponent } from 'src/app/shared/pagination/pagination.component';

@Component({
  selector: 'app-units',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginationComponent],
  template: `
    <div class="glass-card">
      <div class="header-actions">
        <div class="title-group">
          <h2>Unit Master</h2>
          <p>Manage operational units, facilities, and branch units</p>
        </div>
        <button class="btn-primary" (click)="openAddModal()">
          <span>+</span> Add New Unit
        </button>
      </div>

      <div class="search-box">
        <input
          type="text"
          class="search-input"
          placeholder="Search units..."
          [(ngModel)]="searchQuery"
          (input)="filterRecords()"
        />
        <button class="btn-secondary" (click)="loadRecords()">Refresh</button>
      </div>

      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Unit Code</th>
              <th>Unit Name</th>
              <th>Unit Type</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of pagedItems">
              <td><strong>{{ item.unitCode }}</strong></td>
              <td>{{ item.unitName }}</td>
              <td>{{ item.unitType || 'MAIN_BRANCH' }}</td>
              <td>{{ item.email || '-' }}</td>
              <td>{{ item.mobileNumber || '-' }}</td>
              <td><span [class]="getBadgeClass(item.status || (item.isActive ? 'ACTIVE' : 'INACTIVE'))">{{ item.status || (item.isActive ? 'ACTIVE' : 'INACTIVE') }}</span></td>
              <td style="text-align: right;">
                <button class="btn-secondary" style="margin-right: 0.5rem;" (click)="openEditModal(item)">Edit</button>
                <button class="btn-secondary" style="margin-right: 0.5rem;" (click)="toggleActive(item)">
                  {{ item.isActive ? 'Deactivate' : 'Activate' }}
                </button>
              </td>
            </tr>
            <tr *ngIf="filteredItems.length === 0">
              <td colspan="7" class="empty-state">
                No units found. Click "+ Add New Unit" to create one.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <app-pagination
        [totalItems]="filteredItems.length"
        [pageSize]="pageSize"
        [currentPage]="currentPage"
        (pageChange)="onPageChange($event)"
        (pageSizeChange)="onPageSizeChange($event)">
      </app-pagination>
    </div>

    <!-- Add/Edit Modal -->
    <div class="modal-backdrop" *ngIf="isModalOpen">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ isEditMode ? 'Edit Unit' : 'Create New Unit' }}</h3>
          <button class="close-btn" (click)="closeModal()">&times;</button>
        </div>
        <form [formGroup]="recordForm" (ngSubmit)="saveRecord()">
          <div class="form-grid">
            <div class="form-group">
              <label for="unitCode">Unit Code *</label>
              <input id="unitCode" type="text" formControlName="unitCode" class="form-control" placeholder="e.g. UN-MUM-01" />
            </div>
            <div class="form-group">
              <label for="unitName">Unit Name *</label>
              <input id="unitName" type="text" formControlName="unitName" class="form-control" placeholder="e.g. Mumbai Corporate Headquarters" />
            </div>
            <div class="form-group">
              <label for="unitType">Unit Type</label>
              <select id="unitType" formControlName="unitType" class="form-control">
                <option value="HEADQUARTERS">HEADQUARTERS</option>
                <option value="BRANCH">BRANCH</option>
                <option value="REGIONAL_OFFICE">REGIONAL_OFFICE</option>
                <option value="FACILITY">FACILITY</option>
              </select>
            </div>
            <div class="form-group">
              <label for="email">Email Address</label>
              <input id="email" type="email" formControlName="email" class="form-control" placeholder="unit@webicsoft.com" />
            </div>
            <div class="form-group">
              <label for="mobileNumber">Mobile Number</label>
              <input id="mobileNumber" type="text" formControlName="mobileNumber" class="form-control" placeholder="+91 9876543210" />
            </div>
            <div class="form-group">
              <label for="status">Status</label>
              <select id="status" formControlName="status" class="form-control">
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button type="button" class="btn-secondary" (click)="closeModal()">Cancel</button>
            <button type="submit" class="btn-primary" [disabled]="recordForm.invalid">
              {{ isEditMode ? 'Update' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
  :host {
    display: block;
    padding: 1.5rem;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: #f8fafc;
  }
  .glass-card {
    background: rgba(30, 16, 48, 0.65);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(137, 30, 162, 0.25);
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.1);
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
    font-weight: 700;
    margin: 0;
    background: linear-gradient(135deg, #ffffff, #d8b4fe);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .title-group p {
    font-size: 0.875rem;
    color: #94a3b8;
    margin: 0.25rem 0 0 0;
  }
  .btn-primary {
    background: linear-gradient(135deg, #891EA2, #a855f7);
    color: #ffffff;
    border: none;
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
    box-shadow: 0 4px 14px rgba(137, 30, 162, 0.4);
  }
  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(137, 30, 162, 0.6);
  }
  .btn-secondary {
    background: rgba(255, 255, 255, 0.08);
    color: #e2e8f0;
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  .search-box {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
    align-items: center;
  }
  .search-input {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(137, 30, 162, 0.3);
    border-radius: 8px;
    padding: 0.6rem 1rem;
    color: #ffffff;
    font-size: 0.875rem;
    width: 100%;
    max-width: 320px;
    outline: none;
  }
  .search-input:focus {
    border-color: #a855f7;
    box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.25);
  }
  .table-container {
    overflow-x: auto;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  .custom-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 0.875rem;
  }
  .custom-table th {
    background: rgba(137, 30, 162, 0.2);
    color: #cbd5e1;
    font-weight: 600;
    padding: 0.85rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  .custom-table td {
    padding: 0.85rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    color: #e2e8f0;
  }
  .custom-table tbody tr:hover {
    background: rgba(137, 30, 162, 0.1);
  }
  .badge {
    padding: 0.25rem 0.6rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    display: inline-block;
  }
  .badge-active { background: rgba(34, 197, 94, 0.2); color: #86efac; border: 1px solid rgba(34, 197, 94, 0.3); }
  .badge-inactive { background: rgba(148, 163, 184, 0.2); color: #cbd5e1; border: 1px solid rgba(148, 163, 184, 0.3); }
  .modal-backdrop {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .modal-card {
    background: #180928;
    border: 1px solid rgba(137, 30, 162, 0.4);
    border-radius: 16px;
    width: 90%;
    max-width: 580px;
    padding: 1.75rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
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
    color: #ffffff;
  }
  .close-btn {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 1.25rem;
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
    font-size: 0.8rem;
    font-weight: 600;
    color: #cbd5e1;
  }
  .form-control {
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(137, 30, 162, 0.3);
    border-radius: 8px;
    padding: 0.6rem 0.85rem;
    color: #ffffff;
    font-size: 0.875rem;
    outline: none;
  }
  .form-control:focus {
    border-color: #a855f7;
  }
  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #94a3b8;
  }
  `]
})
export class UnitsComponent implements OnInit {
  items: any[] = [];
  filteredItems: any[] = [];
  pagedItems: any[] = [];
  searchQuery: string = '';
  isModalOpen: boolean = false;
  isEditMode: boolean = false;
  selectedId: any = null;
  recordForm!: FormGroup;

  pageSize: number = 10;
  currentPage: number = 1;

  constructor(private api: ApiService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
    this.loadRecords();
  }

  initForm(): void {
    this.recordForm = this.fb.group({
      unitCode: ['', Validators.required],
      unitName: ['', Validators.required],
      unitType: ['HEADQUARTERS', Validators.required],
      email: [''],
      mobileNumber: [''],
      status: ['ACTIVE', Validators.required]
    });
  }

  loadRecords(): void {
    const payload = {
      page: this.currentPage - 1,
      size: this.pageSize,
      search: this.searchQuery
    };
    this.api.post('/v1/units/list', payload).subscribe((res: any) => {
      this.items = Array.isArray(res?.data) ? res.data : [];
      this.filterRecords();
    }, () => {
      this.items = [];
      this.filterRecords();
    });
  }

  filterRecords(): void {
    if (!this.searchQuery.trim()) {
      this.filteredItems = [...this.items];
    } else {
      const q = this.searchQuery.toLowerCase();
      this.filteredItems = this.items.filter(item =>
        Object.values(item).some(val => String(val).toLowerCase().includes(q))
      );
    }
    this.currentPage = 1;
    this.updatePagedItems();
  }

  updatePagedItems(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePagedItems();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.updatePagedItems();
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedId = null;
    this.recordForm.reset({ status: 'ACTIVE', unitType: 'HEADQUARTERS' });
    this.isModalOpen = true;
  }

  openEditModal(item: any): void {
    this.isEditMode = true;
    this.selectedId = item.id;
    this.recordForm.patchValue({
      unitCode: item.unitCode,
      unitName: item.unitName,
      unitType: item.unitType || 'HEADQUARTERS',
      email: item.email || '',
      mobileNumber: item.mobileNumber || '',
      status: item.status || 'ACTIVE'
    });
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveRecord(): void {
    if (this.recordForm.invalid) return;
    const payload = { ...this.recordForm.value, id: this.selectedId };
    this.api.post('/v1/units/create', payload).subscribe(() => {
      this.loadRecords();
      this.closeModal();
    }, () => {
      if (this.isEditMode) {
        const idx = this.items.findIndex(i => i.id === this.selectedId);
        if (idx !== -1) this.items[idx] = { ...this.items[idx], ...payload };
      } else {
        this.items.push({ ...payload, id: Date.now(), isActive: true });
      }
      this.filterRecords();
      this.closeModal();
    });
  }

  toggleActive(item: any): void {
    this.api.post('/v1/units/toggle-active', { id: item.id }).subscribe(() => {
      this.loadRecords();
    }, () => {
      item.isActive = !item.isActive;
      item.status = item.isActive ? 'ACTIVE' : 'INACTIVE';
      this.filterRecords();
    });
  }

  getBadgeClass(status: string): string {
    const s = String(status || '').toUpperCase();
    if (s.includes('ACTIVE')) return 'badge badge-active';
    return 'badge badge-inactive';
  }
}
