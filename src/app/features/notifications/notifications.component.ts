import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="glass-card">
      <div class="header-actions">
        <div class="title-group">
          <h2>Notifications Hub</h2>
          <p>Private employee alerts and company-wide announcements</p>
        </div>
        <button class="btn-primary" (click)="openAddModal()">
          <span>+</span> Create Broadcast Announcement
        </button>
      </div>

      <div class="search-box">
        <input
          type="text"
          class="search-input"
          placeholder="Search notifications..."
          [(ngModel)]="searchQuery"
          (input)="filterRecords()"
        />
        <button class="btn-secondary" (click)="loadRecords()">Refresh</button>
      </div>

      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Scope</th>
              <th>Title</th>
              <th>Message</th>
              <th>Date</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of filteredItems">
              <td>
                <span [class]="getCategoryBadgeClass(item.category || item.type)">
                  {{ item.category || item.type || 'ANNOUNCEMENT' }}
                </span>
              </td>
              <td>
                <span [class]="getScopeBadgeClass(item.scope)">
                  {{ item.scope || (item.recipient ? 'PRIVATE' : 'BROADCAST') }}
                </span>
              </td>
              <td><strong>{{ item.title }}</strong></td>
              <td>{{ item.message }}</td>
              <td>{{ item.createdAt ? (item.createdAt | date:'shortDate') : 'Today' }}</td>
              <td style="text-align: right;">
                <button class="btn-danger" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" (click)="markViewedAndDelete(item)">
                  👁️ Mark Viewed & Delete
                </button>
              </td>
            </tr>
            <tr *ngIf="filteredItems.length === 0">
              <td colspan="6" class="empty-state">
                No active notifications found for your account.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Broadcast Announcement Modal -->
    <div class="modal-backdrop" *ngIf="isModalOpen">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Create Broadcast Announcement</h3>
          <button class="close-btn" (click)="closeModal()">&times;</button>
        </div>
        <form [formGroup]="recordForm" (ngSubmit)="saveRecord()">
          <div class="form-grid">
            <div class="form-group">
              <label for="category">Notification Category</label>
              <select id="category" formControlName="category" class="form-control">
                <option value="ANNOUNCEMENT">📢 General Announcement</option>
                <option value="NEW_JOINEE">🎉 New Employee Joined</option>
                <option value="BIRTHDAY">🎂 Birthday Wish</option>
                <option value="WORK_ANNIVERSARY">🏆 Work Anniversary</option>
                <option value="SYSTEM">⚙️ System Alert</option>
              </select>
            </div>
            <div class="form-group">
              <label for="title">Title</label>
              <input id="title" type="text" formControlName="title" placeholder="Announcement Title" class="form-control" />
            </div>
            <div class="form-group" style="grid-column: 1 / -1;">
              <label for="message">Message</label>
              <textarea id="message" rows="3" formControlName="message" placeholder="Detailed notification content for all employees..." class="form-control"></textarea>
            </div>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button type="button" class="btn-secondary" (click)="closeModal()">Cancel</button>
            <button type="submit" class="btn-primary" [disabled]="recordForm.invalid">
              📢 Broadcast to All
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
    color: #0f172a;
  }
  .glass-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
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
    color: #0f172a;
  }
  .title-group p {
    font-size: 0.875rem;
    color: #64748b;
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
    box-shadow: 0 4px 14px rgba(137, 30, 162, 0.25);
  }
  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(137, 30, 162, 0.35);
  }
  .btn-secondary {
    background: #f1f5f9;
    color: #334155;
    border: 1px solid #cbd5e1;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .btn-secondary:hover {
    background: #e2e8f0;
  }
  .btn-danger {
    background: #ef4444;
    color: #ffffff;
    border: none;
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .btn-danger:hover {
    background: #dc2626;
  }
  .search-box {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
    align-items: center;
  }
  .search-input {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 0.6rem 1rem;
    color: #0f172a;
    font-size: 0.875rem;
    width: 100%;
    max-width: 320px;
    outline: none;
  }
  .search-input:focus {
    border-color: #891EA2;
    box-shadow: 0 0 0 2px rgba(137, 30, 162, 0.15);
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
    background: #f1f5f9;
    color: #475569;
    font-weight: 600;
    padding: 0.85rem 1rem;
    border-bottom: 1px solid #e2e8f0;
  }
  .custom-table td {
    padding: 0.85rem 1rem;
    border-bottom: 1px solid #f1f5f9;
    color: #1e293b;
  }
  .badge {
    padding: 0.25rem 0.6rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    display: inline-block;
  }
  .badge-leave { background: rgba(137, 30, 162, 0.12); color: #891EA2; }
  .badge-new { background: rgba(16, 185, 129, 0.15); color: #047857; }
  .badge-bday { background: rgba(245, 158, 11, 0.15); color: #b45309; }
  .badge-anniversary { background: rgba(59, 130, 246, 0.15); color: #1d4ed8; }
  .badge-broadcast { background: rgba(99, 102, 241, 0.15); color: #4338ca; }
  .badge-private { background: rgba(100, 116, 139, 0.15); color: #334155; }
  .modal-backdrop {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(15, 23, 42, 0.5);
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
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
  }
  .modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    color: #0f172a;
  }
  .close-btn {
    background: none;
    border: none;
    color: #64748b;
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
    color: #475569;
  }
  .form-control {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 0.6rem 0.85rem;
    color: #0f172a;
    font-size: 0.875rem;
    outline: none;
  }
  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #64748b;
  }
  `]
})
export class NotificationsComponent implements OnInit {
  items: any[] = [];
  filteredItems: any[] = [];
  searchQuery: string = '';
  isModalOpen: boolean = false;
  recordForm!: FormGroup;

  constructor(private api: ApiService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
    this.loadRecords();
  }

  initForm(): void {
    this.recordForm = this.fb.group({
      category: ['ANNOUNCEMENT', Validators.required],
      title: ['', Validators.required],
      message: ['', Validators.required]
    });
  }

  loadRecords(): void {
    this.api.post('/v1/notifications/list', {}).subscribe((res: any) => {
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
    this.recordForm.reset({ category: 'ANNOUNCEMENT' });
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveRecord(): void {
    if (this.recordForm.invalid) return;
    const payload = this.recordForm.value;
    this.api.post('/v1/notifications/create-broadcast', payload).subscribe(() => {
      this.loadRecords();
      this.closeModal();
    }, () => {
      this.items.unshift({
        ...payload,
        id: Date.now(),
        scope: 'BROADCAST',
        createdAt: new Date().toISOString()
      });
      this.filterRecords();
      this.closeModal();
    });
  }

  markViewedAndDelete(item: any): void {
    this.api.post('/v1/notifications/mark-viewed', { id: item.id }).subscribe(() => {
      this.items = this.items.filter(i => i.id !== item.id);
      this.filterRecords();
    }, () => {
      this.items = this.items.filter(i => i.id !== item.id);
      this.filterRecords();
    });
  }

  getCategoryBadgeClass(category: string): string {
    const c = String(category || '').toUpperCase();
    if (c.includes('LEAVE')) return 'badge badge-leave';
    if (c.includes('JOINEE') || c.includes('NEW')) return 'badge badge-new';
    if (c.includes('BIRTHDAY') || c.includes('BDAY')) return 'badge badge-bday';
    if (c.includes('ANNIVERSARY')) return 'badge badge-anniversary';
    return 'badge badge-broadcast';
  }

  getScopeBadgeClass(scope: string): string {
    const s = String(scope || '').toUpperCase();
    if (s.includes('BROADCAST')) return 'badge badge-broadcast';
    return 'badge badge-private';
  }
}
