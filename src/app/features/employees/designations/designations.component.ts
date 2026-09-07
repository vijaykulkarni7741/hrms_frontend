import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-designations',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="glass-card">
      <div class="header-actions">
        <div class="title-group">
          <h2>Designations Management</h2>
          <p>Manage job titles and designation grades</p>
        </div>
        <button class="btn-primary" (click)="openAddModal()">
          <span>+</span> Add New
        </button>
      </div>

      <div class="search-box">
        <input
          type="text"
          class="search-input"
          placeholder="Search records..."
          [(ngModel)]="searchQuery"
          (input)="filterRecords()"
        />
        <button class="btn-secondary" (click)="loadRecords()">Refresh</button>
      </div>

      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Title</th>
              <th>Department</th>
              <th>Grade</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of filteredItems">
              <td>{{ item.designationCode }}</td>
              <td>{{ item.title }}</td>
              <td>{{ item.departmentName }}</td>
              <td>{{ item.gradeLevel }}</td>
              <td><span [class]="getBadgeClass(item.status)">{{ item.status || 'ACTIVE' }}</span></td>
              <td style="text-align: right;">
                <button class="btn-secondary" style="margin-right: 0.5rem;" (click)="openEditModal(item)">Edit</button>
                <button class="btn-danger" (click)="deleteRecord(item)">Delete</button>
              </td>
            </tr>
            <tr *ngIf="filteredItems.length === 0">
              <td colspan="6" class="empty-state">
                No records found. Click "+ Add New" to create one.
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
          <h3>{{ isEditMode ? 'Edit Record' : 'Create New Record' }}</h3>
          <button class="close-btn" (click)="closeModal()">&times;</button>
        </div>
        <form [formGroup]="recordForm" (ngSubmit)="saveRecord()">
          <div class="form-grid">
            
            <div class="form-group">
              <label for="designationCode">Code</label>
              
              <input id="designationCode" type="text" formControlName="designationCode" class="form-control" />
            </div>
            <div class="form-group">
              <label for="title">Title</label>
              
              <input id="title" type="text" formControlName="title" class="form-control" />
            </div>
            <div class="form-group">
              <label for="departmentName">Department</label>
              <select id="departmentName" formControlName="departmentName" class="form-control select-dropdown">
                <option value="">-- Select Department --</option>
                <option *ngFor="let dept of departments" [value]="dept.departmentName">
                  {{ dept.departmentName }} ({{ dept.departmentCode }})
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="gradeLevel">Grade</label>
              
              <input id="gradeLevel" type="text" formControlName="gradeLevel" class="form-control" />
            </div>
            <div class="form-group">
              <label for="status">Status</label>
              
              <select id="status" formControlName="status" class="form-control">
                <option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option>
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
  .btn-danger {
    background: rgba(239, 68, 68, 0.2);
    color: #fca5a5;
    border: 1px solid rgba(239, 68, 68, 0.3);
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .btn-danger:hover {
    background: rgba(239, 68, 68, 0.4);
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
  .badge-pending { background: rgba(234, 179, 8, 0.2); color: #fde047; border: 1px solid rgba(234, 179, 8, 0.3); }
  .badge-approved { background: rgba(59, 130, 246, 0.2); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.3); }
  .badge-rejected { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.3); }
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
    text-transform: capitalize;
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
export class DesignationsComponent implements OnInit {
  items: any[] = [];
  filteredItems: any[] = [];
  departments: any[] = [];
  searchQuery: string = '';
  isModalOpen: boolean = false;
  isEditMode: boolean = false;
  selectedId: any = null;
  recordForm!: FormGroup;

  constructor(private api: ApiService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
    this.loadRecords();
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.api.post('/v1/departments/list', {}).subscribe({
      next: (res: any) => {
        this.departments = (res && Array.isArray(res.data)) ? res.data : (res && Array.isArray(res)) ? res : [];
      },
      error: () => {
        this.departments = [];
      }
    });
  }

  initForm(): void {
    this.recordForm = this.fb.group({
      designationCode: ['', Validators.required],
      title: ['', Validators.required],
      departmentName: ['', Validators.required],
      gradeLevel: ['', Validators.required],
      status: ['', Validators.required]
    });
  }

  loadRecords(): void {
    this.api.post('/v1/designation/list', {}).subscribe((res: any) => {
      this.items = (res && Array.isArray(res.data)) ? res.data : (res && Array.isArray(res)) ? res : [];
      this.filterRecords();
    }, () => {
      this.items = [];
      this.filterRecords();
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
    this.isEditMode = false;
    this.selectedId = null;
    this.recordForm.reset();
    this.isModalOpen = true;
  }

  openEditModal(item: any): void {
    this.isEditMode = true;
    this.selectedId = item.id;
    this.recordForm.patchValue(item);
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveRecord(): void {
    if (this.recordForm.invalid) return;
    const payload = { ...this.recordForm.value, id: this.selectedId };
    const endpoint = this.isEditMode ? '/v1/designation/update' : '/v1/designation/create';
    this.api.post(endpoint, payload).subscribe(() => {
      this.loadRecords();
      this.closeModal();
    }, () => {
      if (this.isEditMode) {
        const idx = this.items.findIndex(i => i.id === this.selectedId);
        if (idx !== -1) this.items[idx] = { ...payload };
      } else {
        this.items.push({ ...payload, id: Date.now().toString() });
      }
      this.filterRecords();
      this.closeModal();
    });
  }

  deleteRecord(item: any): void {
    if (confirm('Are you sure you want to delete this record?')) {
      this.api.post('/v1/designation/delete', { id: item.id }).subscribe(() => {
        this.loadRecords();
      }, () => {
        this.items = this.items.filter(i => i.id !== item.id);
        this.filterRecords();
      });
    }
  }

  getBadgeClass(status: string): string {
    const s = String(status || '').toUpperCase();
    if (s.includes('ACTIVE') || s.includes('APPROVED')) return 'badge badge-active';
    if (s.includes('PENDING')) return 'badge badge-pending';
    if (s.includes('REJECTED') || s.includes('CANCEL')) return 'badge badge-rejected';
    return 'badge badge-inactive';
  }
}
