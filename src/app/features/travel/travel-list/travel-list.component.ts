import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';
import { ToastService } from 'src/app/core/services/toast.service';

interface TravelRequest {
  id: number;
  employee: { id: number; firstName: string; lastName: string; employeeCode: string };
  destination: string; purpose: string;
  startDate: string; endDate: string;
  estimatedBudget: number; advanceRequested: number;
  status: string; createdAt: string;
}

@Component({
  selector: 'app-travel-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2 class="page-title">✈️ Travel Requests</h2>
          <p class="page-subtitle">View and manage travel requests</p>
        </div>
        <button class="btn btn-primary" (click)="openModal()" id="add-travel-btn">➕ New Request</button>
      </div>

      <div class="filter-bar">
        <div class="search-box form-group" style="margin-bottom:0;flex:1;">
          <span class="search-icon">🔍</span>
          <input class="form-control" placeholder="Search destination or employee…" [(ngModel)]="search" (ngModelChange)="applyFilter()" id="travel-search" />
        </div>
        <select class="form-control" style="width:160px;" [(ngModel)]="filterStatus" (ngModelChange)="applyFilter()" id="travel-status-filter">
          <option value="">All Status</option>
          <option>PENDING</option><option>APPROVED</option><option>REJECTED</option><option>COMPLETED</option>
        </select>
      </div>

      <div class="card" style="padding:0;overflow:hidden;">
        @if (isLoading()) { <div class="flex-center" style="padding:60px;"><div class="spinner spinner-lg"></div></div>
        } @else if (filtered().length === 0) {
          <div class="empty-state"><div class="empty-icon">✈️</div><h3>No travel requests</h3></div>
        } @else {
          <div class="table-wrapper">
            <table>
              <thead><tr><th>Employee</th><th>Destination</th><th>Purpose</th><th>From</th><th>To</th><th>Budget</th><th>Advance</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                @for (t of filtered(); track t.id) {
                  <tr>
                    <td>
                      <div style="font-weight:600;">{{ t.employee.firstName }} {{ t.employee.lastName }}</div>
                      <div style="font-size:0.75rem;color:var(--text-muted);">{{ t.employee.employeeCode }}</div>
                    </td>
                    <td><strong>{{ t.destination }}</strong></td>
                    <td style="max-width:160px;" class="truncate">{{ t.purpose || '—' }}</td>
                    <td>{{ fmt(t.startDate) }}</td>
                    <td>{{ fmt(t.endDate) }}</td>
                    <td>{{ t.estimatedBudget ? '₹' + formatAmt(t.estimatedBudget) : '—' }}</td>
                    <td>{{ t.advanceRequested ? '₹' + formatAmt(t.advanceRequested) : '—' }}</td>
                    <td><span class="badge" [class]="badge(t.status)">{{ t.status }}</span></td>
                    <td>
                      <div style="display:flex;gap:6px;">
                        <button class="btn btn-secondary btn-sm btn-icon" (click)="view(t)" [id]="'view-travel-'+t.id" title="View">👁️</button>
                        @if (t.status === 'PENDING') {
                          <button class="btn btn-danger btn-sm btn-icon" (click)="cancel(t)" [id]="'cancel-travel-'+t.id" title="Cancel">🚫</button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>

    <!-- New Travel Modal -->
    @if (showModal()) {
      <div class="overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()" style="max-width:580px;">
          <div class="modal-header">
            <h3 class="modal-title">✈️ New Travel Request</h3>
            <span class="cursor-pointer" (click)="closeModal()" id="close-travel-modal">✕</span>
          </div>
          <div class="form-group">
            <label class="form-label">Destination *</label>
            <input class="form-control" [(ngModel)]="form.destination" placeholder="e.g. Mumbai, Maharashtra" id="travel-dest" />
          </div>
          <div class="form-group">
            <label class="form-label">Purpose</label>
            <textarea class="form-control" rows="2" [(ngModel)]="form.purpose" id="travel-purpose" style="resize:vertical;" placeholder="Purpose of travel…"></textarea>
          </div>
          <div class="grid grid-2">
            <div class="form-group">
              <label class="form-label">Start Date *</label>
              <input type="date" class="form-control" [(ngModel)]="form.startDate" id="travel-start" />
            </div>
            <div class="form-group">
              <label class="form-label">End Date *</label>
              <input type="date" class="form-control" [(ngModel)]="form.endDate" id="travel-end" />
            </div>
            <div class="form-group">
              <label class="form-label">Estimated Budget (₹)</label>
              <input type="number" class="form-control" [(ngModel)]="form.estimatedBudget" id="travel-budget" placeholder="0.00" />
            </div>
            <div class="form-group">
              <label class="form-label">Advance Requested (₹)</label>
              <input type="number" class="form-control" [(ngModel)]="form.advanceRequested" id="travel-advance" placeholder="0.00" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()" id="cancel-travel-modal">Cancel</button>
            <button class="btn btn-primary" (click)="submit()" [disabled]="submitting()" id="submit-travel-btn">
              @if (submitting()) { <div class="spinner"></div> } Submit Request
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class TravelListComponent implements OnInit {
  private api   = inject(ApiService);
  private toast = inject(ToastService);

  requests  = signal<TravelRequest[]>([]);
  filtered  = signal<TravelRequest[]>([]);
  isLoading = signal(true);
  submitting = signal(false);
  showModal  = signal(false);
  search = ''; filterStatus = '';
  form = { destination:'', purpose:'', startDate:'', endDate:'', estimatedBudget: 0, advanceRequested: 0 };

  ngOnInit() { this.load(); }
  load() {
    this.isLoading.set(true);
    this.api.post<TravelRequest[]>('/v1/travel-requests/list', {}).subscribe({
      next: (r: any) => { this.requests.set(r.data??[]); this.applyFilter(); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }
  applyFilter() {
    let l = this.requests();
    if (this.search) { const q = this.search.toLowerCase(); l = l.filter(t => t.destination.toLowerCase().includes(q) || `${t.employee.firstName} ${t.employee.lastName}`.toLowerCase().includes(q)); }
    if (this.filterStatus) l = l.filter(t => t.status === this.filterStatus);
    this.filtered.set(l);
  }
  openModal()  { this.form = { destination:'', purpose:'', startDate:'', endDate:'', estimatedBudget:0, advanceRequested:0 }; this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }
  submit() {
    if (!this.form.destination || !this.form.startDate || !this.form.endDate) { this.toast.warning('Fill all required fields.'); return; }
    this.submitting.set(true);
    this.api.post('/v1/travel-requests/create', { ...this.form, status: 'PENDING' }).subscribe({
      next: () => { this.toast.success('Travel request submitted!'); this.closeModal(); this.load(); this.submitting.set(false); },
      error: () => this.submitting.set(false)
    });
  }
  cancel(t: TravelRequest) {
    this.api.post('/v1/travel-requests/toggle-active', { id: t.id }).subscribe({
      next: () => { this.toast.success('Request cancelled.'); this.load(); }
    });
  }
  view(t: TravelRequest) {}
  fmt(d: string) { return d ? new Date(d).toLocaleDateString('en-IN') : '—'; }
  formatAmt(n: number) { return n.toLocaleString('en-IN'); }
  badge(s: string) {
    const m: Record<string,string> = { PENDING:'badge-warning', APPROVED:'badge-success', REJECTED:'badge-danger', COMPLETED:'badge-info' };
    return m[s] ?? 'badge-info';
  }
}
