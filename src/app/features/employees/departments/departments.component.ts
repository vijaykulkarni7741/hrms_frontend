import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

interface Department { id: number; departmentCode: string; departmentName: string; departmentType: string; email: string; mobile: string; extensionNumber: string; description: string; status: string; isActive: boolean; displayOrder: number; }

@Component({ selector: 'app-departments', standalone: true, imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div><h2 class="page-title">🏢 Departments</h2><p class="page-subtitle">{{ items().length }} departments</p></div>
        <button class="btn btn-primary" (click)="openModal()" id="add-dept-btn">➕ Add Department</button>
      </div>
      <div class="card" style="padding:0;overflow:hidden;">
        @if (isLoading()) { <div class="flex-center" style="padding:60px;"><div class="spinner spinner-lg"></div></div>
        } @else if (items().length===0) { <div class="empty-state"><div class="empty-icon">🏢</div><h3>No departments</h3></div>
        } @else {
          <div class="table-wrapper"><table>
            <thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Email</th><th>Mobile</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              @for (d of items(); track d.id) {
                <tr>
                  <td><code style="background:var(--bg-input);padding:2px 6px;border-radius:4px;font-size:0.78rem;">{{ d.departmentCode }}</code></td>
                  <td><strong>{{ d.departmentName }}</strong></td>
                  <td>{{ d.departmentType || '—' }}</td>
                  <td>{{ d.email || '—' }}</td>
                  <td>{{ d.mobile || '—' }}</td>
                  <td><span class="badge" [class]="d.status==='ACTIVE'?'badge-success':'badge-warning'">{{ d.status }}</span></td>
                  <td><div style="display:flex;gap:6px;">
                    <button class="btn btn-secondary btn-sm btn-icon" (click)="openModal(d)" [id]="'edit-dept-'+d.id">✏️</button>
                    <button class="btn btn-sm btn-icon" [class]="d.isActive?'btn-danger':'btn-success'" (click)="toggleActive(d)" [id]="'toggle-dept-'+d.id">{{ d.isActive?'🚫':'✅' }}</button>
                  </div></td>
                </tr>
              }
            </tbody>
          </table></div>
        }
      </div>
    </div>
    @if (showModal()) {
      <div class="overlay" (click)="closeModal()"><div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header"><h3 class="modal-title">{{ editing() ? 'Edit' : 'Add' }} Department</h3><span class="cursor-pointer" (click)="closeModal()" id="close-dept-modal">✕</span></div>
        <div class="grid grid-2">
          <div class="form-group"><label class="form-label">Department Code *</label><input class="form-control" [(ngModel)]="form.departmentCode" id="dept-code" /></div>
          <div class="form-group"><label class="form-label">Department Name *</label><input class="form-control" [(ngModel)]="form.departmentName" id="dept-name" /></div>
          <div class="form-group"><label class="form-label">Department Type</label><input class="form-control" [(ngModel)]="form.departmentType" id="dept-type" placeholder="e.g. Technical, HR" /></div>
          <div class="form-group"><label class="form-label">Email</label><input type="email" class="form-control" [(ngModel)]="form.email" id="dept-email" /></div>
          <div class="form-group"><label class="form-label">Mobile</label><input class="form-control" [(ngModel)]="form.mobile" id="dept-mobile" /></div>
          <div class="form-group"><label class="form-label">Extension</label><input class="form-control" [(ngModel)]="form.extensionNumber" id="dept-ext" /></div>
        </div>
        <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" rows="2" [(ngModel)]="form.description" id="dept-desc" style="resize:vertical;"></textarea></div>
        <div class="grid grid-2">
          <div class="form-group"><label class="form-label">Status</label><select class="form-control" [(ngModel)]="form.status" id="dept-status"><option>ACTIVE</option><option>INACTIVE</option></select></div>
          <div class="form-group"><label class="form-label">Display Order</label><input type="number" class="form-control" [(ngModel)]="form.displayOrder" id="dept-order" /></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeModal()" id="cancel-dept-btn">Cancel</button>
          <button class="btn btn-primary" (click)="submit()" [disabled]="submitting()" id="save-dept-btn">@if(submitting()){<div class="spinner"></div>} Save</button>
        </div>
      </div></div>
    }
  `,
})
export class DepartmentsComponent implements OnInit {
  private api = inject(ApiService); private toast = inject(ToastService);
  items = signal<Department[]>([]); isLoading = signal(true); submitting = signal(false); showModal = signal(false); editing = signal<Department|null>(null);
  form: any = { departmentCode:'', departmentName:'', departmentType:'', email:'', mobile:'', extensionNumber:'', description:'', status:'ACTIVE', displayOrder:0 };
  ngOnInit() { this.load(); }
  load() { this.isLoading.set(true); this.api.post<Department[]>('/v1/departments/list',{}).subscribe({ next:r=>{this.items.set(r.data??[]);this.isLoading.set(false);}, error:()=>this.isLoading.set(false) }); }
  openModal(d?: Department) { this.editing.set(d??null); this.form = d ? {...d} : {departmentCode:'',departmentName:'',departmentType:'',email:'',mobile:'',extensionNumber:'',description:'',status:'ACTIVE',displayOrder:0}; this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }
  submit() {
    if (!this.form.departmentCode || !this.form.departmentName) { this.toast.warning('Code and name are required.'); return; }
    this.submitting.set(true);
    const payload = this.editing() ? {id:this.editing()!.id,...this.form} : this.form;
    this.api.post('/v1/departments/create', payload).subscribe({ next:()=>{this.toast.success('Saved!');this.closeModal();this.load();this.submitting.set(false);}, error:()=>this.submitting.set(false) });
  }
  toggleActive(d: Department) { this.api.post('/v1/departments/toggle-active',{id:d.id}).subscribe({next:()=>{this.toast.success('Updated!');this.load();}}); }
}
