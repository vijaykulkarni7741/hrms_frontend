import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

interface SalaryComponent {
  id: number; componentName: string; componentType: string;
  calculationType: string; description: string; status: string; isActive: boolean;
}

@Component({
  selector: 'app-salary-components',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2 class="page-title">🔧 Salary Components</h2>
          <p class="page-subtitle">Manage earnings and deduction components</p>
        </div>
        <button class="btn btn-primary" (click)="openModal()" id="add-component-btn">➕ Add Component</button>
      </div>

      <div class="filter-bar">
        <select class="form-control" style="width:160px;" [(ngModel)]="filterType" (ngModelChange)="applyFilter()" id="comp-type-filter">
          <option value="">All Types</option><option>EARNING</option><option>DEDUCTION</option>
        </select>
      </div>

      <div class="card" style="padding:0;overflow:hidden;">
        @if (isLoading()) { <div class="flex-center" style="padding:60px;"><div class="spinner spinner-lg"></div></div>
        } @else if (filtered().length === 0) {
          <div class="empty-state"><div class="empty-icon">🔧</div><h3>No components found</h3></div>
        } @else {
          <div class="table-wrapper">
            <table>
              <thead><tr><th>Component Name</th><th>Type</th><th>Calc Type</th><th>Description</th><th>Status</th><th>Active</th><th>Actions</th></tr></thead>
              <tbody>
                @for (c of filtered(); track c.id) {
                  <tr>
                    <td><strong>{{ c.componentName }}</strong></td>
                    <td><span class="badge" [class]="c.componentType==='EARNING' ? 'badge-success' : 'badge-danger'">{{ c.componentType }}</span></td>
                    <td><span class="badge badge-info">{{ c.calculationType }}</span></td>
                    <td>{{ c.description || '—' }}</td>
                    <td><span class="badge" [class]="c.status==='ACTIVE'?'badge-success':'badge-warning'">{{ c.status }}</span></td>
                    <td><span class="badge" [class]="c.isActive?'badge-success':'badge-danger'">{{ c.isActive ? 'Yes' : 'No' }}</span></td>
                    <td>
                      <div style="display:flex;gap:6px;">
                        <button class="btn btn-secondary btn-sm btn-icon" (click)="openModal(c)" [id]="'edit-comp-'+c.id" title="Edit">✏️</button>
                        <button class="btn btn-sm btn-icon" [class]="c.isActive?'btn-danger':'btn-success'" (click)="toggleActive(c)" [id]="'toggle-comp-'+c.id">{{ c.isActive ? '🚫':'✅' }}</button>
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

    @if (showModal()) {
      <div class="overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">{{ editing() ? 'Edit' : 'Add' }} Salary Component</h3>
            <span class="cursor-pointer" (click)="closeModal()" id="close-comp-modal">✕</span>
          </div>
          <div class="form-group">
            <label class="form-label">Component Name *</label>
            <input class="form-control" [(ngModel)]="form.componentName" placeholder="e.g. Basic Salary" id="comp-name" />
          </div>
          <div class="grid grid-2">
            <div class="form-group">
              <label class="form-label">Component Type *</label>
              <select class="form-control" [(ngModel)]="form.componentType" id="comp-type">
                <option value="">Select type</option><option>EARNING</option><option>DEDUCTION</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Calculation Type</label>
              <select class="form-control" [(ngModel)]="form.calculationType" id="comp-calc-type">
                <option value="">Select</option><option>FIXED</option><option>PERCENTAGE</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-control" rows="2" [(ngModel)]="form.description" id="comp-desc" style="resize:vertical;"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-control" [(ngModel)]="form.status" id="comp-status">
              <option>ACTIVE</option><option>INACTIVE</option>
            </select>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()" id="cancel-comp-btn">Cancel</button>
            <button class="btn btn-primary" (click)="submit()" [disabled]="submitting()" id="save-comp-btn">
              @if (submitting()) { <div class="spinner"></div> } {{ editing() ? 'Update' : 'Add' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class SalaryComponentsComponent implements OnInit {
  private api   = inject(ApiService);
  private toast = inject(ToastService);

  components = signal<SalaryComponent[]>([]);
  filtered   = signal<SalaryComponent[]>([]);
  isLoading  = signal(true);
  submitting = signal(false);
  showModal  = signal(false);
  editing    = signal<SalaryComponent | null>(null);
  filterType = '';
  form = { componentName:'', componentType:'', calculationType:'', description:'', status:'ACTIVE' };

  ngOnInit() { this.load(); }
  load() {
    this.isLoading.set(true);
    this.api.post<SalaryComponent[]>('/v1/salary-components/list', {}).subscribe({
      next: r => { this.components.set(r.data??[]); this.applyFilter(); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }
  applyFilter() {
    let l = this.components();
    if (this.filterType) l = l.filter(c => c.componentType === this.filterType);
    this.filtered.set(l);
  }
  openModal(c?: SalaryComponent) {
    if (c) { this.editing.set(c); this.form = { componentName:c.componentName, componentType:c.componentType, calculationType:c.calculationType, description:c.description, status:c.status }; }
    else   { this.editing.set(null); this.form = { componentName:'', componentType:'', calculationType:'', description:'', status:'ACTIVE' }; }
    this.showModal.set(true);
  }
  closeModal() { this.showModal.set(false); }
  submit() {
    if (!this.form.componentName || !this.form.componentType) { this.toast.warning('Name and type are required.'); return; }
    this.submitting.set(true);
    const payload = this.editing() ? { id: this.editing()!.id, ...this.form } : this.form;
    this.api.post('/v1/salary-components/create', payload).subscribe({
      next: () => { this.toast.success('Saved!'); this.closeModal(); this.load(); this.submitting.set(false); },
      error: () => this.submitting.set(false)
    });
  }
  toggleActive(c: SalaryComponent) {
    this.api.post('/v1/salary-components/toggle-active', { id: c.id }).subscribe({
      next: () => { this.toast.success('Updated!'); this.load(); }
    });
  }
}
