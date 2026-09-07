import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';
import { AuthStateService } from 'src/app/core/state/auth-state.service';

@Component({
  selector: 'app-policies',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="glass-card">
      <div class="header-actions">
        <div class="title-group">
          <h2>Company Policies</h2>
          <p>Webic Soft India Pvt Ltd — Organizational Compliance & Policy Hub</p>
        </div>
        <button *ngIf="canCreatePolicy" class="btn-primary" (click)="openAddModal()" id="add-policy-btn">
          <span>+</span> Create Policy Request
        </button>
      </div>

      <!-- Status Filter Tabs -->
      <div class="filter-tabs">
        <button class="tab-btn" [class.active]="selectedTab === 'ALL'" (click)="setFilterTab('ALL')">
          All Policies ({{ items.length }})
        </button>
        <button *ngIf="canViewPendingTab" class="tab-btn pending-tab" [class.active]="selectedTab === 'PENDING'" (click)="setFilterTab('PENDING')">
          ⏳ Pending Approvals ({{ pendingCount }})
        </button>

        <button class="tab-btn approved-tab" [class.active]="selectedTab === 'APPROVED'" (click)="setFilterTab('APPROVED')">
          ✅ Approved ({{ approvedCount }})
        </button>
        <button class="tab-btn rejected-tab" [class.active]="selectedTab === 'REJECTED'" (click)="setFilterTab('REJECTED')">
          ❌ Rejected
        </button>
      </div>

      <div class="search-box">
        <input
          type="text"
          class="search-input"
          placeholder="Search by policy title, code, category..."
          [(ngModel)]="searchQuery"
          (input)="filterRecords()"
        />
        <button class="btn-secondary" (click)="loadRecords()">🔄 Refresh</button>
      </div>

      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Policy Code</th>
              <th>Policy Title</th>
              <th>Category</th>
              <th>Submitted By</th>
              <th>Approved By / Status</th>
              <th>Action / Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of filteredItems">
              <td><strong>{{ item.policyCode || 'POL-' + item.id }}</strong></td>
              <td>
                <div class="policy-title-cell">
                  <div class="p-title">{{ item.policyTitle || item.title }}</div>
                  <div class="p-desc">{{ item.description }}</div>
                </div>
              </td>
              <td><span class="category-badge">{{ item.category || 'GENERAL' }}</span></td>
              <td>{{ item.createdBy || 'HR Executive' }}</td>
              <td>
                <div class="status-stack">
                  <span [class]="getBadgeClass(item.status)">{{ item.status || 'APPROVED' }}</span>
                  <span class="approver-name" *ngIf="item.approvedBy">By: {{ item.approvedBy }}</span>
                  <span class="rejection-text" *ngIf="item.rejectionReason">Reason: {{ item.rejectionReason }}</span>
                </div>
              </td>
              <td>
                <div class="action-btn-group">
                  <!-- HR Executive Submit Action -->
                  <button *ngIf="canSubmitPolicy && (item.status === 'DRAFT' || !item.status)"
                          class="btn-action submit-btn"
                          (click)="submitForApproval(item)">
                    📤 Submit
                  </button>

                  <!-- HR Manager Approve / Reject Actions -->
                  <ng-container *ngIf="canApproveReject && item.status === 'PENDING_APPROVAL'">
                    <button class="btn-action approve-btn" (click)="approvePolicy(item)">
                      ✔️ Approve
                    </button>
                    <button class="btn-action reject-btn" (click)="openRejectModal(item)">
                      ❌ Reject
                    </button>
                  </ng-container>

                  <!-- View details for employees -->
                  <button class="btn-secondary" (click)="viewPolicyDetails(item)">
                    👁️ View
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredItems.length === 0">
              <td colspan="6" class="empty-state">
                No policy records found in database.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div class="modal-backdrop" *ngIf="isModalOpen">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ isEditMode ? 'Edit Policy' : 'Create HR Policy Request' }}</h3>
          <button class="close-btn" (click)="closeModal()">&times;</button>
        </div>
        <form [formGroup]="recordForm" (ngSubmit)="saveRecord()">
          <div class="form-grid">
            <div class="form-group">
              <label for="policyCode">Policy Code</label>
              <input id="policyCode" type="text" formControlName="policyCode" class="form-control" placeholder="e.g. POL-SEC-01" />
            </div>
            <div class="form-group">
              <label for="policyTitle">Policy Title</label>
              <input id="policyTitle" type="text" formControlName="policyTitle" class="form-control" placeholder="Policy Title" />
            </div>
            <div class="form-group">
              <label for="category">Category</label>
              <select id="category" formControlName="category" class="form-control">
                <option value="SECURITY">IT & SECURITY</option>
                <option value="WORKPLACE">WORKPLACE & HYBRID</option>
                <option value="COMPLIANCE">COMPLIANCE & POSH</option>
                <option value="LEAVE">LEAVE & ATTENDANCE</option>
                <option value="OPERATIONS">OPERATIONS & SHIFTS</option>
              </select>
            </div>
            <div class="form-group full-width">
              <label for="description">Policy Content / Description</label>
              <textarea id="description" formControlName="description" class="form-control text-area" rows="4" placeholder="Detailed terms and guidelines of the policy..."></textarea>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" (click)="closeModal()">Cancel</button>
            <button type="submit" class="btn-primary" [disabled]="recordForm.invalid">
              Save Draft
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Reject Reason Modal -->
    <div class="modal-backdrop" *ngIf="isRejectModalOpen">
      <div class="modal-card mini-card">
        <div class="modal-header">
          <h3>Reject Policy Request</h3>
          <button class="close-btn" (click)="closeRejectModal()">&times;</button>
        </div>
        <div class="form-group">
          <label>Specify Rejection Reason</label>
          <textarea class="form-control text-area" [(ngModel)]="rejectionReason" rows="3" placeholder="Reason for rejecting policy request..."></textarea>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" (click)="closeRejectModal()">Cancel</button>
          <button type="button" class="btn-danger" (click)="confirmReject()">
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>

    <!-- Policy Detail View Modal -->
    <div class="modal-backdrop" *ngIf="selectedPolicyForView">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ selectedPolicyForView.policyTitle || selectedPolicyForView.title }}</h3>
          <button class="close-btn" (click)="selectedPolicyForView = null">&times;</button>
        </div>
        <div class="view-policy-body">
          <div class="v-meta">
            <span class="category-badge">{{ selectedPolicyForView.category }}</span>
            <span [class]="getBadgeClass(selectedPolicyForView.status)">{{ selectedPolicyForView.status }}</span>
          </div>
          <p class="v-desc">{{ selectedPolicyForView.description }}</p>
          <div class="v-footer">
            <span>Created By: {{ selectedPolicyForView.createdBy || 'HR Executive' }}</span>
            <span *ngIf="selectedPolicyForView.approvedBy">Approved By: {{ selectedPolicyForView.approvedBy }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding: 1.5rem;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: var(--text-primary);
    }
    .glass-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--border-radius);
      padding: 1.5rem;
      box-shadow: var(--shadow-md);
    }
    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .title-group h2 {
      font-size: 1.35rem; font-weight: 700; margin: 0; color: var(--text-primary);
    }
    .title-group p {
      font-size: 0.82rem; color: var(--text-muted); margin-top: 2px;
    }
    .filter-tabs {
      display: flex; gap: 8px; margin-bottom: 1rem; flex-wrap: wrap;
    }
    .tab-btn {
      padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;
      border: 1px solid var(--border); background: var(--bg-input); color: var(--text-secondary);
      cursor: pointer; transition: all 0.2s ease;
    }
    .tab-btn.active {
      background: var(--primary); color: #fff; border-color: var(--primary);
    }
    .tab-btn.pending-tab.active { background: #d97706; border-color: #d97706; }
    .tab-btn.approved-tab.active { background: #16a34a; border-color: #16a34a; }
    .btn-primary {
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: #ffffff; border: none; padding: 0.6rem 1.2rem;
      border-radius: var(--border-radius-sm); font-weight: 600; font-size: 0.875rem;
      cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem;
      box-shadow: var(--shadow-sm); transition: all 0.2s ease;
    }
    .btn-secondary {
      background: var(--bg-input); color: var(--text-secondary);
      border: 1px solid var(--border); padding: 0.45rem 0.85rem;
      border-radius: 6px; font-size: 0.8rem; cursor: pointer;
    }
    .btn-danger {
      background: #ef4444; color: #ffffff; border: none;
      padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.85rem; cursor: pointer;
    }
    .search-box {
      display: flex; gap: 0.75rem; margin-bottom: 1.25rem; align-items: center;
    }
    .search-input {
      background: var(--bg-input); border: 1px solid var(--border);
      border-radius: 8px; padding: 0.55rem 0.9rem; color: var(--text-primary);
      font-size: 0.875rem; width: 100%; max-width: 360px; outline: none;
    }
    .table-container {
      overflow-x: auto; border-radius: 10px; border: 1px solid var(--border);
    }
    .custom-table {
      width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;
    }
    .custom-table th {
      background: var(--primary-subtle); color: var(--text-primary);
      font-weight: 600; padding: 0.85rem 1rem; border-bottom: 1px solid var(--border);
    }
    .custom-table td {
      padding: 0.85rem 1rem; border-bottom: 1px solid var(--border); color: var(--text-secondary);
    }
    .policy-title-cell .p-title { font-weight: 600; color: var(--text-primary); }
    .policy-title-cell .p-desc { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }
    .category-badge {
      background: var(--primary-subtle); color: var(--primary-light);
      padding: 3px 8px; border-radius: 12px; font-size: 0.72rem; font-weight: 600;
    }
    .status-stack { display: flex; flex-direction: column; gap: 2px; }
    .approver-name { font-size: 0.7rem; color: var(--text-muted); }
    .rejection-text { font-size: 0.7rem; color: var(--danger); }
    .badge {
      padding: 0.25rem 0.6rem; border-radius: 9999px; font-size: 0.72rem; font-weight: 600; display: inline-block;
    }
    .badge-approved { background: rgba(34, 197, 94, 0.15); color: #16a34a; border: 1px solid rgba(34, 197, 94, 0.3); }
    .badge-pending { background: rgba(217, 119, 6, 0.15); color: #d97706; border: 1px solid rgba(217, 119, 6, 0.3); }
    .badge-rejected { background: rgba(239, 68, 68, 0.15); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.3); }
    .badge-draft { background: rgba(148, 163, 184, 0.15); color: #64748b; border: 1px solid rgba(148, 163, 184, 0.3); }

    .action-btn-group { display: flex; gap: 6px; align-items: center; }
    .btn-action {
      padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; border: none; cursor: pointer;
    }
    .submit-btn { background: #2563eb; color: #fff; }
    .approve-btn { background: #16a34a; color: #fff; }
    .reject-btn { background: #dc2626; color: #fff; }

    .modal-backdrop {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal-card {
      background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px;
      width: 90%; max-width: 580px; padding: 1.5rem; box-shadow: var(--shadow-lg);
    }
    .mini-card { max-width: 440px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .close-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-muted); }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.25rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .form-group.full-width { grid-column: 1 / -1; }
    .form-control {
      background: var(--bg-input); border: 1px solid var(--border); border-radius: 6px;
      padding: 0.55rem 0.85rem; color: var(--text-primary); font-size: 0.875rem; outline: none;
    }
    .text-area { font-family: inherit; resize: vertical; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem; }
    .empty-state { text-align: center; padding: 3rem 1rem; color: var(--text-muted); }
    .view-policy-body { display: flex; flex-direction: column; gap: 12px; }
    .v-meta { display: flex; gap: 8px; }
    .v-desc { font-size: 0.9rem; line-height: 1.5; color: var(--text-secondary); }
    .v-footer { display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-muted); border-top: 1px solid var(--border); padding-top: 10px; }
  `]
})
export class PoliciesComponent implements OnInit {
  private api = inject(ApiService);
  private fb  = inject(FormBuilder);
  public authState = inject(AuthStateService);

  items: any[] = [];
  filteredItems: any[] = [];
  searchQuery: string = '';
  selectedTab: string = 'ALL';

  isModalOpen: boolean = false;
  isEditMode: boolean = false;
  selectedId: any = null;
  recordForm!: FormGroup;

  isRejectModalOpen: boolean = false;
  targetPolicyForReject: any = null;
  rejectionReason: string = '';

  selectedPolicyForView: any = null;

  get currentUser() { return this.authState.user(); }

  get isHrManagerOrAdmin(): boolean {
    return this.authState.isAdmin() || this.authState.isHR() || (this.currentUser?.role || '').includes('HR_MANAGER');
  }

  get isHrExecutive(): boolean {
    return (this.currentUser?.role || '').includes('HR_EXECUTIVE');
  }

  get canViewPendingTab(): boolean {
    return this.authState.hasPermission('POLICY_PENDING_TAB') || this.authState.hasPermission('POLICY_APPROVE_BTN') || this.isHrManagerOrAdmin;
  }

  get canCreatePolicy(): boolean {
    return this.authState.hasPermission('POLICY_CREATE_BTN') || this.isHrManagerOrAdmin || this.isHrExecutive;
  }

  get canApproveReject(): boolean {
    return this.authState.hasPermission('POLICY_APPROVE_BTN') || this.authState.hasPermission('POLICY_REJECT_BTN') || this.isHrManagerOrAdmin;
  }

  get canSubmitPolicy(): boolean {
    return this.authState.hasPermission('POLICY_SUBMIT_BTN') || this.isHrExecutive || this.isHrManagerOrAdmin;
  }

  get pendingCount(): number {
    return this.items.filter(i => i.status === 'PENDING_APPROVAL').length;
  }

  get approvedCount(): number {
    return this.items.filter(i => i.status === 'APPROVED' || i.status === 'ACTIVE').length;
  }

  ngOnInit(): void {
    this.initForm();
    this.loadRecords();
  }

  initForm(): void {
    this.recordForm = this.fb.group({
      policyCode: ['POL-' + Math.floor(100 + Math.random() * 900), Validators.required],
      policyTitle: ['', Validators.required],
      category: ['SECURITY', Validators.required],
      description: ['', Validators.required]
    });
  }

  loadRecords(): void {
    this.api.post('/v1/admin/policies/list', {}).subscribe({
      next: (res: any) => {
        this.items = res?.data || [];
        this.filterRecords();
      },
      error: () => {
        this.items = [];
        this.filterRecords();
      }
    });
  }

  setFilterTab(tab: string): void {
    this.selectedTab = tab;
    this.filterRecords();
  }

  filterRecords(): void {
    let result = [...this.items];

    // Filter tab
    if (this.selectedTab === 'PENDING') {
      result = result.filter(i => i.status === 'PENDING_APPROVAL');
    } else if (this.selectedTab === 'APPROVED') {
      result = result.filter(i => i.status === 'APPROVED' || i.status === 'ACTIVE');
    } else if (this.selectedTab === 'REJECTED') {
      result = result.filter(i => i.status === 'REJECTED');
    }

    // Search query
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(item =>
        (item.policyTitle || item.title || '').toLowerCase().includes(q) ||
        (item.policyCode || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q)
      );
    }

    this.filteredItems = result;
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedId = null;
    this.recordForm.reset({
      policyCode: 'POL-' + Math.floor(100 + Math.random() * 900),
      category: 'SECURITY'
    });
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveRecord(): void {
    if (this.recordForm.invalid) return;
    const payload = {
      ...this.recordForm.value,
      id: this.selectedId,
      status: this.isHrExecutive ? 'PENDING_APPROVAL' : 'APPROVED',
      createdBy: this.currentUser?.email || 'HR Executive'
    };

    this.api.post('/v1/admin/policies/create', payload).subscribe({
      next: () => {
        this.loadRecords();
        this.closeModal();
      },
      error: () => {
        this.loadRecords();
        this.closeModal();
      }
    });
  }

  submitForApproval(item: any): void {
    this.api.post('/v1/admin/policies/submit-approval', {
      id: item.id,
      username: this.currentUser?.email || 'HR Executive'
    }).subscribe(() => this.loadRecords());
  }

  approvePolicy(item: any): void {
    this.api.post('/v1/admin/policies/approve', {
      id: item.id,
      approvedBy: this.currentUser?.fullName || this.currentUser?.email || 'Pooja Kulkarni (HR Manager)'
    }).subscribe(() => this.loadRecords());
  }

  openRejectModal(item: any): void {
    this.targetPolicyForReject = item;
    this.rejectionReason = '';
    this.isRejectModalOpen = true;
  }

  closeRejectModal(): void {
    this.isRejectModalOpen = false;
    this.targetPolicyForReject = null;
  }

  confirmReject(): void {
    if (!this.targetPolicyForReject) return;
    this.api.post('/v1/admin/policies/reject', {
      id: this.targetPolicyForReject.id,
      rejectedBy: this.currentUser?.fullName || this.currentUser?.email || 'Pooja Kulkarni (HR Manager)',
      reason: this.rejectionReason || 'Policy terms require revision.'
    }).subscribe(() => {
      this.closeRejectModal();
      this.loadRecords();
    });
  }

  viewPolicyDetails(item: any): void {
    this.selectedPolicyForView = item;
  }

  getBadgeClass(status: string): string {
    const s = String(status || '').toUpperCase();
    if (s.includes('APPROVED') || s.includes('ACTIVE')) return 'badge badge-approved';
    if (s.includes('PENDING')) return 'badge badge-pending';
    if (s.includes('REJECTED')) return 'badge badge-rejected';
    return 'badge badge-draft';
  }
}
