import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';
import { encryptStorageData, decryptStorageData } from 'src/app/core/utils/crypto.utils';

export interface ModuleMaster {
  id: number;
  moduleCode: string;
  moduleName: string;
  icon: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface SubmoduleMaster {
  id: number;
  moduleId: number;
  submoduleCode: string;
  submoduleName: string;
  routePath: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ButtonMaster {
  id: number;
  moduleId: number;
  submoduleId: number;
  buttonCode: string;
  buttonName: string;
  actionType: 'BUTTON' | 'ACTION' | 'VIEW' | 'EXPORT';
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface RolePermissionMap {
  roleCode: string;
  roleName: string;
  assignedButtonCodes: string[];
}

export interface UserPermissionOverride {
  userId: number;
  employeeCode: string;
  employeeName: string;
  roleCode: string;
  overrides: Record<string, 'DEFAULT' | 'GRANT' | 'DENY'>;
}



@Component({
  selector: 'app-permissions',
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

    <!-- Main Navigation Tabs -->
    <div class="tab-header mb-4">
      <button class="tab-btn" [class.active]="activeTab === 'modules'" (click)="activeTab = 'modules'">
        📁 1. Module Master
      </button>
      <button class="tab-btn" [class.active]="activeTab === 'submodules'" (click)="activeTab = 'submodules'">
        📂 2. Submodule Master
      </button>
      <button class="tab-btn" [class.active]="activeTab === 'buttons'" (click)="activeTab = 'buttons'">
        🔘 3. Button / Action Master
      </button>
      <button class="tab-btn" [class.active]="activeTab === 'roleMatrix'" (click)="activeTab = 'roleMatrix'">
        🛡️ 4. Role Permission Matrix
      </button>
      <button class="tab-btn" [class.active]="activeTab === 'userOverrides'" (click)="activeTab = 'userOverrides'">
        👤 5. User Overrides
      </button>
    </div>

    <!-- TAB 1: MODULE MASTER -->
    <div *ngIf="activeTab === 'modules'" class="glass-card">
      <div class="header-actions">
        <div class="title-group">
          <h2>📁 Module Master</h2>
          <p>Define top-level system modules (1 Module ➔ Has Multiple Submodules)</p>
        </div>
        <button class="btn-primary" (click)="openAddModuleModal()">
          <span>+</span> Add Module
        </button>
      </div>

      <div class="table-container" *ngIf="moduleList.length > 0">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Icon</th>
              <th>Module Code</th>
              <th>Module Name</th>
              <th>Total Submodules</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let mod of moduleList">
              <td style="font-size: 1.25rem;">{{ mod.icon }}</td>
              <td><code class="code-pill">{{ mod.moduleCode }}</code></td>
              <td><strong>{{ mod.moduleName }}</strong></td>
              <td><span class="badge badge-button">{{ getSubmoduleCountForModule(mod.id) }} Submodules</span></td>
              <td><span [class]="getBadgeClass(mod.status)">{{ mod.status }}</span></td>
              <td style="text-align: right;">
                <div class="action-btn-group">
                  <button class="btn-secondary sm" (click)="openEditModuleModal(mod)">Edit</button>
                  <button class="btn-danger sm" (click)="deleteModule(mod.id)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="empty-state-box" *ngIf="moduleList.length === 0">
        <div class="empty-icon">📁</div>
        <h3>No Modules Master Configured Yet</h3>
        <p>Click below to create your first top-level module master.</p>
        <button class="btn-primary mt-3" (click)="openAddModuleModal()">+ Add Module</button>
      </div>
    </div>

    <!-- TAB 2: SUBMODULE MASTER -->
    <div *ngIf="activeTab === 'submodules'" class="glass-card">
      <div class="header-actions">
        <div class="title-group">
          <h2>📂 Submodule Master</h2>
          <p>Define submodules mapped to Parent Modules (1 Submodule ➔ Has Multiple Buttons)</p>
        </div>
        <button class="btn-primary" (click)="openAddSubmoduleModal()">
          <span>+</span> Add Submodule
        </button>
      </div>

      <div class="filter-toolbar mb-3" *ngIf="moduleList.length > 0">
        <label>Filter by Parent Module:</label>
        <select class="filter-select" [(ngModel)]="filterModuleId">
          <option [value]="0">All Modules</option>
          <option *ngFor="let m of moduleList" [value]="m.id">{{ m.icon }} {{ m.moduleName }}</option>
        </select>
      </div>

      <div class="table-container" *ngIf="getFilteredSubmodules().length > 0">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Parent Module</th>
              <th>Submodule Code</th>
              <th>Submodule Name</th>
              <th>Route Path</th>
              <th>Total Buttons</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let sub of getFilteredSubmodules()">
              <td><span class="module-tag">{{ getModuleName(sub.moduleId) }}</span></td>
              <td><code class="code-pill">{{ sub.submoduleCode }}</code></td>
              <td><strong>{{ sub.submoduleName }}</strong></td>
              <td><span class="text-muted">{{ sub.routePath }}</span></td>
              <td><span class="badge badge-action">{{ getButtonCountForSubmodule(sub.id) }} Buttons</span></td>
              <td><span [class]="getBadgeClass(sub.status)">{{ sub.status }}</span></td>
              <td style="text-align: right;">
                <div class="action-btn-group">
                  <button class="btn-secondary sm" (click)="openEditSubmoduleModal(sub)">Edit</button>
                  <button class="btn-danger sm" (click)="deleteSubmodule(sub.id)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="empty-state-box" *ngIf="getFilteredSubmodules().length === 0">
        <div class="empty-icon">📂</div>
        <h3>No Submodules Master Configured</h3>
        <p>Add submodules under your active parent modules.</p>
        <button class="btn-primary mt-3" (click)="openAddSubmoduleModal()">+ Add Submodule</button>
      </div>
    </div>

    <!-- TAB 3: BUTTON / ACTION MASTER -->
    <div *ngIf="activeTab === 'buttons'" class="glass-card">
      <div class="header-actions">
        <div class="title-group">
          <h2>🔘 Button & Action Master</h2>
          <p>Map UI buttons and action permissions under specific Parent Submodules</p>
        </div>
        <button class="btn-primary" (click)="openAddButtonModal()">
          <span>+</span> Add Button / Action
        </button>
      </div>

      <div class="filter-toolbar mb-3" *ngIf="moduleList.length > 0">
        <label>Filter Module:</label>
        <select class="filter-select" [(ngModel)]="filterButtonModuleId" (change)="filterButtonSubmoduleId = 0">
          <option [value]="0">All Modules</option>
          <option *ngFor="let m of moduleList" [value]="m.id">{{ m.icon }} {{ m.moduleName }}</option>
        </select>

        <label class="ml-3">Filter Submodule:</label>
        <select class="filter-select" [(ngModel)]="filterButtonSubmoduleId">
          <option [value]="0">All Submodules</option>
          <option *ngFor="let s of getSubmodulesForModule(filterButtonModuleId)" [value]="s.id">
            {{ s.submoduleName }}
          </option>
        </select>
      </div>

      <div class="table-container" *ngIf="getFilteredButtons().length > 0">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Permission Code</th>
              <th>Parent Module</th>
              <th>Parent Submodule</th>
              <th>Button / Action Name</th>
              <th>Type</th>
              <th>Description</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let btn of getFilteredButtons()">
              <td><code class="code-pill">{{ btn.buttonCode }}</code></td>
              <td><span class="module-tag">{{ getModuleName(btn.moduleId) }}</span></td>
              <td>{{ getSubmoduleName(btn.submoduleId) }}</td>
              <td><strong>{{ btn.buttonName }}</strong></td>
              <td><span [class]="getTypeBadgeClass(btn.actionType)">{{ btn.actionType }}</span></td>
              <td>{{ btn.description }}</td>
              <td><span [class]="getBadgeClass(btn.status)">{{ btn.status }}</span></td>
              <td style="text-align: right;">
                <div class="action-btn-group">
                  <button class="btn-secondary sm" (click)="openEditButtonModal(btn)">Edit</button>
                  <button class="btn-danger sm" (click)="deleteButton(btn.id)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="empty-state-box" *ngIf="getFilteredButtons().length === 0">
        <div class="empty-icon">🔘</div>
        <h3>No Button / Action Master Entries Found</h3>
        <p>Click below to define granular action permissions for UI buttons and tabs.</p>
        <button class="btn-primary mt-3" (click)="openAddButtonModal()">+ Add Button Master</button>
      </div>
    </div>

    <!-- TAB 4: ROLE PERMISSION MATRIX -->
    <div *ngIf="activeTab === 'roleMatrix'" class="glass-card">
      <div class="header-actions">
        <div class="title-group">
          <h2>🛡️ Role Permission Matrix</h2>
          <p>Assign module, submodule, and button permissions to system roles</p>
        </div>
        <button class="btn-primary" (click)="saveRoleMatrix()">
          💾 Save Role Matrix Configuration
        </button>
      </div>

      <div class="role-selector-bar" *ngIf="roleList.length > 0">
        <label>Select System Role:</label>
        <div class="role-pills">
          <button
            *ngFor="let r of roleList"
            class="role-pill-btn"
            [class.active]="selectedRoleCode === r.roleCode"
            (click)="selectedRoleCode = r.roleCode"
          >
            {{ r.roleName }} ({{ r.assignedButtonCodes.length }} perms)
          </button>
        </div>
      </div>

      <div class="empty-state-box" *ngIf="roleList.length === 0">
        <div class="empty-icon">🛡️</div>
        <h3>No System Roles Loaded</h3>
        <p>Create roles in Role Master or check backend connection.</p>
      </div>

      <div class="matrix-container mt-4" *ngIf="selectedRole">
        <div class="matrix-header-info">
          <h3>Role: <span class="highlight">{{ selectedRole.roleName }}</span> (<code>{{ selectedRole.roleCode }}</code>)</h3>
          <div class="matrix-quick-actions">
            <button class="btn-secondary sm" (click)="grantAllForRole()">✓ Check All</button>
            <button class="btn-secondary sm" (click)="revokeAllForRole()">✖ Uncheck All</button>
          </div>
        </div>

        <div class="module-group-card" *ngFor="let mod of moduleList">
          <div class="module-group-header">
            <h4>{{ mod.icon }} {{ mod.moduleName }}</h4>
            <span class="group-count">{{ getGrantedCountForModuleRole(mod.id) }} Granted</span>
          </div>

          <div *ngFor="let sub of getSubmodulesForModule(mod.id)" class="submodule-block mb-3">
            <div class="submodule-title">📂 {{ sub.submoduleName }} (<code>{{ sub.routePath }}</code>)</div>

            <div class="permission-grid">
              <div
                class="perm-checkbox-tile"
                *ngFor="let b of getButtonsForSubmodule(sub.id)"
                [class.checked]="isPermissionGrantedToRole(b.buttonCode)"
                (click)="toggleRolePermission(b.buttonCode)"
              >
                <input
                  type="checkbox"
                  [checked]="isPermissionGrantedToRole(b.buttonCode)"
                  (change)="$event.stopPropagation(); toggleRolePermission(b.buttonCode)"
                />
                <div class="tile-info">
                  <span class="tile-btn">🔘 {{ b.buttonName }}</span>
                  <code class="tile-code">{{ b.buttonCode }}</code>
                </div>
              </div>
              <div *ngIf="getButtonsForSubmodule(sub.id).length === 0" class="text-muted p-2 font-sm">
                No buttons mapped under this submodule yet.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 5: USER PERMISSION OVERRIDES -->
    <div *ngIf="activeTab === 'userOverrides'" class="glass-card">
      <div class="header-actions">
        <div class="title-group">
          <h2>👤 User-Specific Permission Overrides</h2>
          <p>Grant or revoke specific buttons for individual employees regardless of their base role</p>
        </div>
        <button class="btn-primary" (click)="saveUserOverrides()">
          💾 Save User Overrides
        </button>
      </div>

      <div class="role-selector-bar mb-4" *ngIf="userList.length > 0">
        <div class="form-group" style="margin: 0; min-width: 320px;">
          <label style="color: #0f172a; font-weight: 700; font-size: 0.85rem; margin-bottom: 0.35rem; display: block;">Select Employee / User:</label>
          <select class="form-control" [(ngModel)]="selectedUserId" (change)="onUserSelectChange()">
            <option *ngFor="let u of userList" [value]="u.userId">
              {{ u.employeeCode }} - {{ u.employeeName }} (Role: {{ u.roleCode }})
            </option>
          </select>
        </div>
      </div>

      <div class="empty-state-box" *ngIf="userList.length === 0">
        <div class="empty-icon">👤</div>
        <h3>No Users / Employee Overrides Available</h3>
        <p>Employee list will populate from user directory or database backend.</p>
      </div>

      <div class="table-container" *ngIf="selectedUserOverride">
        <div class="user-banner-info mb-3">
          <strong>👤 Employee:</strong> {{ selectedUserOverride.employeeName }} ({{ selectedUserOverride.employeeCode }})
          <span class="role-badge ml-2">Base Role: {{ selectedUserOverride.roleCode }}</span>
        </div>

        <table class="custom-table">
          <thead>
            <tr>
              <th>Module</th>
              <th>Submodule</th>
              <th>Button / Action Name</th>
              <th>Permission Code</th>
              <th>Base Role Status</th>
              <th>User Specific Override</th>
              <th>Final Effective Access</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let b of buttonList">
              <td><span class="module-tag">{{ getModuleName(b.moduleId) }}</span></td>
              <td>{{ getSubmoduleName(b.submoduleId) }}</td>
              <td><strong>{{ b.buttonName }}</strong></td>
              <td><code class="code-pill">{{ b.buttonCode }}</code></td>
              <td>
                <span *ngIf="isRolePermissionDefaultGranted(b.buttonCode)" class="badge badge-active">✓ Granted by Role</span>
                <span *ngIf="!isRolePermissionDefaultGranted(b.buttonCode)" class="badge badge-inactive">✖ Denied by Role</span>
              </td>
              <td>
                <div class="override-pill-group">
                  <button
                    class="override-btn default"
                    [class.active]="getUserOverrideStatus(b.buttonCode) === 'DEFAULT'"
                    (click)="setUserOverrideStatus(b.buttonCode, 'DEFAULT')"
                  >
                    Default (Role)
                  </button>
                  <button
                    class="override-btn grant"
                    [class.active]="getUserOverrideStatus(b.buttonCode) === 'GRANT'"
                    (click)="setUserOverrideStatus(b.buttonCode, 'GRANT')"
                  >
                    ✓ Grant (Allow)
                  </button>
                  <button
                    class="override-btn deny"
                    [class.active]="getUserOverrideStatus(b.buttonCode) === 'DENY'"
                    (click)="setUserOverrideStatus(b.buttonCode, 'DENY')"
                  >
                    ✖ Deny (Revoke)
                  </button>
                </div>
              </td>
              <td>
                <span [class]="getFinalEffectiveBadgeClass(b.buttonCode)">
                  {{ getFinalEffectiveText(b.buttonCode) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>



    <!-- MODAL 1: ADD / EDIT MODULE -->
    <div class="modal-backdrop" *ngIf="isModuleModalOpen">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ isEditMode ? 'Edit Module Master' : 'Add New Module Master' }}</h3>
          <button class="close-btn" (click)="isModuleModalOpen = false">&times;</button>
        </div>
        <form [formGroup]="moduleForm" (ngSubmit)="saveModule()">
          <div class="form-grid">
            <div class="form-group">
              <label>Module Code *</label>
              <input type="text" formControlName="moduleCode" class="form-control" placeholder="e.g. SHIFTS, EMPLOYEES" />
            </div>
            <div class="form-group">
              <label>Module Name *</label>
              <input type="text" formControlName="moduleName" class="form-control" placeholder="e.g. Attendance & Shifts" />
            </div>
            <div class="form-group">
              <label>Module Icon *</label>
              <input type="text" formControlName="icon" class="form-control" placeholder="e.g. 🕒, 👥, 🌴" />
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
            <button type="button" class="btn-secondary" (click)="isModuleModalOpen = false">Cancel</button>
            <button type="submit" class="btn-primary" [disabled]="moduleForm.invalid">Save Module</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 2: ADD / EDIT SUBMODULE -->
    <div class="modal-backdrop" *ngIf="isSubmoduleModalOpen">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ isEditMode ? 'Edit Submodule Master' : 'Add New Submodule Master' }}</h3>
          <button class="close-btn" (click)="isSubmoduleModalOpen = false">&times;</button>
        </div>
        <form [formGroup]="submoduleForm" (ngSubmit)="saveSubmodule()">
          <div class="form-grid">
            <div class="form-group">
              <label>Select Parent Module *</label>
              <select formControlName="moduleId" class="form-control">
                <option *ngFor="let m of moduleList" [value]="m.id">{{ m.icon }} {{ m.moduleName }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Submodule Code *</label>
              <input type="text" formControlName="submoduleCode" class="form-control" placeholder="e.g. ROSTER, SHIFT_MASTER" />
            </div>
            <div class="form-group">
              <label>Submodule Name *</label>
              <input type="text" formControlName="submoduleName" class="form-control" placeholder="e.g. Employee Roster Schedule" />
            </div>
            <div class="form-group">
              <label>Route Path</label>
              <input type="text" formControlName="routePath" class="form-control" placeholder="e.g. /shifts" />
            </div>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
            <button type="button" class="btn-secondary" (click)="isSubmoduleModalOpen = false">Cancel</button>
            <button type="submit" class="btn-primary" [disabled]="submoduleForm.invalid">Save Submodule</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 3: ADD / EDIT BUTTON -->
    <div class="modal-backdrop" *ngIf="isButtonModalOpen">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ isEditMode ? 'Edit Button Master' : 'Add New Button / Action Master' }}</h3>
          <button class="close-btn" (click)="isButtonModalOpen = false">&times;</button>
        </div>
        <form [formGroup]="buttonForm" (ngSubmit)="saveButton()">
          <div class="form-grid">
            <div class="form-group">
              <label>Select Parent Module *</label>
              <select formControlName="moduleId" class="form-control" (change)="onButtonModalModuleChange()">
                <option *ngFor="let m of moduleList" [value]="m.id">{{ m.icon }} {{ m.moduleName }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>Select Parent Submodule *</label>
              <select formControlName="submoduleId" class="form-control" (change)="autoGenerateButtonCode()">
                <option *ngFor="let s of getSubmodulesForModule(buttonForm.get('moduleId')?.value)" [value]="s.id">
                  {{ s.submoduleName }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Button / Action Name *</label>
              <input type="text" formControlName="buttonName" class="form-control" placeholder="e.g. Create Roster Button, Edit Shift" (input)="autoGenerateButtonCode()" />
            </div>

            <div class="form-group">
              <label>Permission Code *</label>
              <input type="text" formControlName="buttonCode" class="form-control" placeholder="e.g. ROSTER_CREATE" />
            </div>

            <div class="form-group">
              <label>Action Type *</label>
              <select formControlName="actionType" class="form-control">
                <option value="BUTTON">BUTTON (Clickable Button)</option>
                <option value="ACTION">ACTION (Form Submission)</option>
                <option value="VIEW">VIEW (Tab / Screen View)</option>
                <option value="EXPORT">EXPORT (Data Download)</option>
              </select>
            </div>

            <div class="form-group full-width">
              <label>Description</label>
              <input type="text" formControlName="description" class="form-control" placeholder="e.g. Allows user to click Create/Assign Roster button" />
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
            <button type="button" class="btn-secondary" (click)="isButtonModalOpen = false">Cancel</button>
            <button type="submit" class="btn-primary" [disabled]="buttonForm.invalid">Save Button Master</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
  :host { display: block; padding: 1.5rem; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #0f172a; }
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
  .filter-select:focus { border-color: #891EA2; box-shadow: 0 0 0 3px rgba(137, 30, 162, 0.15); }

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
  .badge-action { background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; }
  .badge-view { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
  .badge-export { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }

  /* Role & Matrix */
  .role-selector-bar { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; background: #f8fafc; padding: 1rem 1.25rem; border-radius: 12px; border: 1px solid #e2e8f0; }
  .role-selector-bar label { color: #0f172a; font-weight: 800; font-size: 0.875rem; }
  .role-pills { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .role-pill-btn { background: #ffffff; border: 1px solid #cbd5e1; color: #334155; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all 0.2s ease; }
  .role-pill-btn:hover { border-color: #891EA2; color: #891EA2; background: #faf5ff; }
  .role-pill-btn.active { background: #891EA2; color: #ffffff; border-color: #891EA2; box-shadow: 0 4px 12px rgba(137, 30, 162, 0.3); }

  .matrix-header-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; background: #faf5ff; padding: 0.85rem 1.25rem; border-radius: 10px; border: 1px solid #e9d5ff; }
  .matrix-header-info h3 { margin: 0; font-size: 1.1rem; color: #0f172a; font-weight: 800; }
  .highlight { color: #891EA2; font-weight: 800; }
  .matrix-quick-actions { display: flex; gap: 0.5rem; }

  .module-group-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.25rem; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03); }
  .module-group-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.6rem; }
  .module-group-header h4 { margin: 0; font-size: 1.05rem; color: #0f172a; font-weight: 800; }
  .group-count { font-size: 0.8rem; color: #891EA2; font-weight: 800; background: #f3e8ff; padding: 0.2rem 0.6rem; border-radius: 999px; border: 1px solid #e9d5ff; }

  .submodule-block { background: #f8fafc; padding: 1rem; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 0.75rem; }
  .submodule-title { font-size: 0.875rem; font-weight: 800; color: #6b1680; margin-bottom: 0.75rem; }

  .permission-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.85rem; }
  .perm-checkbox-tile { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.85rem; display: flex; align-items: flex-start; gap: 0.75rem; cursor: pointer; transition: all 0.2s ease; }
  .perm-checkbox-tile:hover { background: #faf5ff; border-color: #a855f7; }
  .perm-checkbox-tile.checked { background: #faf5ff; border-color: #891EA2; box-shadow: 0 4px 12px rgba(137, 30, 162, 0.12); }
  .perm-checkbox-tile input[type="checkbox"] { margin-top: 0.2rem; cursor: pointer; accent-color: #891EA2; }
  .tile-info { display: flex; flex-direction: column; gap: 0.15rem; }
  .tile-btn { font-size: 0.875rem; font-weight: 800; color: #0f172a; }
  .tile-code { font-size: 0.72rem; color: #6b1680; font-weight: 800; }

  /* User Overrides */
  .override-pill-group { display: flex; gap: 0.35rem; }
  .override-btn { border: 1px solid #cbd5e1; background: #ffffff; color: #64748b; padding: 0.3rem 0.65rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease; }
  .override-btn.default.active { background: #e2e8f0; color: #1e293b; border-color: #94a3b8; }
  .override-btn.grant.active { background: #dcfce7; color: #15803d; border-color: #22c55e; }
  .override-btn.deny.active { background: #fee2e2; color: #b91c1c; border-color: #ef4444; }

  .user-banner-info { background: #faf5ff; border: 1px solid #e9d5ff; padding: 0.85rem 1.25rem; border-radius: 10px; font-size: 0.9rem; color: #0f172a; }
  .role-badge { background: #891EA2; color: #ffffff; padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 800; }

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
export class PermissionsComponent implements OnInit {
  activeTab: 'modules' | 'submodules' | 'buttons' | 'roleMatrix' | 'userOverrides' = 'modules';

  // 1-to-Many Master Lists
  moduleList: ModuleMaster[] = [];
  submoduleList: SubmoduleMaster[] = [];
  buttonList: ButtonMaster[] = [];

  // Filter States
  filterModuleId: number = 0;
  filterButtonModuleId: number = 0;
  filterButtonSubmoduleId: number = 0;

  // Modals & Form Controls
  isModuleModalOpen: boolean = false;
  isSubmoduleModalOpen: boolean = false;
  isButtonModalOpen: boolean = false;
  isEditMode: boolean = false;
  selectedId: any = null;

  moduleForm!: FormGroup;
  submoduleForm!: FormGroup;
  buttonForm!: FormGroup;

  // Role Matrix & User Overrides
  roleList: RolePermissionMap[] = [];
  selectedRoleCode: string = 'ROLE_HR_MANAGER';
  userList: UserPermissionOverride[] = [];
  selectedUserId: number = 1;

  // Toast
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';
  isToastVisible: boolean = false;

  constructor(private api: ApiService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForms();
    this.loadMasters();
    this.loadRoleMatrix();
    this.loadUserOverrides();
  }

  showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = msg;
    this.toastType = type;
    this.isToastVisible = true;
    setTimeout(() => { this.isToastVisible = false; }, 3500);
  }

  initForms(): void {
    this.moduleForm = this.fb.group({
      moduleCode: ['', Validators.required],
      moduleName: ['', Validators.required],
      icon: ['📁', Validators.required],
      status: ['ACTIVE', Validators.required]
    });

    this.submoduleForm = this.fb.group({
      moduleId: [1, Validators.required],
      submoduleCode: ['', Validators.required],
      submoduleName: ['', Validators.required],
      routePath: ['', Validators.required],
      status: ['ACTIVE', Validators.required]
    });

    this.buttonForm = this.fb.group({
      moduleId: [1, Validators.required],
      submoduleId: [1, Validators.required],
      buttonCode: ['', Validators.required],
      buttonName: ['', Validators.required],
      actionType: ['BUTTON', Validators.required],
      description: ['', Validators.required],
      status: ['ACTIVE', Validators.required]
    });
  }

  private persistState(): void {
    try {
      sessionStorage.setItem('hrms_modules', encryptStorageData(JSON.stringify(this.moduleList)));
      sessionStorage.setItem('hrms_submodules', encryptStorageData(JSON.stringify(this.submoduleList)));
      sessionStorage.setItem('hrms_buttons', encryptStorageData(JSON.stringify(this.buttonList)));
      sessionStorage.setItem('hrms_role_matrix', encryptStorageData(JSON.stringify(this.roleList)));
      sessionStorage.setItem('hrms_user_overrides', encryptStorageData(JSON.stringify(this.userList)));
    } catch {
      // ignore
    }
  }

  private restoreState(): boolean {
    try {
      const mStr = decryptStorageData(sessionStorage.getItem('hrms_modules'));
      const sStr = decryptStorageData(sessionStorage.getItem('hrms_submodules'));
      const bStr = decryptStorageData(sessionStorage.getItem('hrms_buttons'));
      const rStr = decryptStorageData(sessionStorage.getItem('hrms_role_matrix'));
      const uStr = decryptStorageData(sessionStorage.getItem('hrms_user_overrides'));

      if (mStr && sStr && bStr) {
        this.moduleList = JSON.parse(mStr);
        this.submoduleList = JSON.parse(sStr);
        this.buttonList = JSON.parse(bStr);
        if (rStr) this.roleList = JSON.parse(rStr);
        if (uStr) this.userList = JSON.parse(uStr);
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }

  loadMasters(): void {
    if (this.restoreState()) return;

    this.api.post('/v1/admin/modules/list', {}).subscribe({
      next: (res: any) => {
        if (res && res.data && Array.isArray(res.data)) {
          this.moduleList = res.data;
          this.persistState();
        }
      },
      error: () => {}
    });

    this.api.post('/v1/admin/submodules/list', {}).subscribe({
      next: (res: any) => {
        if (res && res.data && Array.isArray(res.data)) {
          this.submoduleList = res.data;
          this.persistState();
        }
      },
      error: () => {}
    });

    this.api.post('/v1/admin/permissions/list', {}).subscribe({
      next: (res: any) => {
        if (res && res.data && Array.isArray(res.data)) {
          this.buttonList = res.data;
          this.persistState();
        }
      },
      error: () => {}
    });
  }

  loadRoleMatrix(): void {
    this.api.post('/v1/admin/roles/list', {}).subscribe({
      next: (res: any) => {
        if (res && res.data && Array.isArray(res.data)) {
          this.roleList = res.data;
          this.persistState();
        }
      },
      error: () => {}
    });
  }

  loadUserOverrides(): void {
    this.api.post('/v1/admin/users/list', {}).subscribe({
      next: (res: any) => {
        if (res && res.data && Array.isArray(res.data)) {
          this.userList = res.data;
          this.persistState();
        }
      },
      error: () => {}
    });
  }

  // Helper Mapping Functions
  getModuleName(modId: number): string {
    const m = this.moduleList.find(i => Number(i.id) === Number(modId));
    return m ? m.moduleName : 'Unknown Module';
  }

  getSubmoduleName(subId: number): string {
    const s = this.submoduleList.find(i => Number(i.id) === Number(subId));
    return s ? s.submoduleName : 'Unknown Submodule';
  }

  getSubmoduleCountForModule(modId: number): number {
    return this.submoduleList.filter(s => Number(s.moduleId) === Number(modId)).length;
  }

  getButtonCountForSubmodule(subId: number): number {
    return this.buttonList.filter(b => Number(b.submoduleId) === Number(subId)).length;
  }

  getFilteredSubmodules(): SubmoduleMaster[] {
    if (!this.filterModuleId || Number(this.filterModuleId) === 0) return this.submoduleList;
    return this.submoduleList.filter(s => Number(s.moduleId) === Number(this.filterModuleId));
  }

  getSubmodulesForModule(modId: number): SubmoduleMaster[] {
    return this.submoduleList.filter(s => Number(s.moduleId) === Number(modId));
  }

  getButtonsForSubmodule(subId: number): ButtonMaster[] {
    return this.buttonList.filter(b => Number(b.submoduleId) === Number(subId));
  }

  getFilteredButtons(): ButtonMaster[] {
    let list = [...this.buttonList];
    if (this.filterButtonModuleId && Number(this.filterButtonModuleId) !== 0) {
      list = list.filter(b => Number(b.moduleId) === Number(this.filterButtonModuleId));
    }
    if (this.filterButtonSubmoduleId && Number(this.filterButtonSubmoduleId) !== 0) {
      list = list.filter(b => Number(b.submoduleId) === Number(this.filterButtonSubmoduleId));
    }
    return list;
  }

  // Module Master Modals
  openAddModuleModal(): void {
    this.isEditMode = false;
    this.selectedId = null;
    this.moduleForm.reset({ icon: '📁', status: 'ACTIVE' });
    this.isModuleModalOpen = true;
  }

  openEditModuleModal(mod: ModuleMaster): void {
    this.isEditMode = true;
    this.selectedId = mod.id;
    this.moduleForm.patchValue(mod);
    this.isModuleModalOpen = true;
  }

  saveModule(): void {
    if (this.moduleForm.invalid) return;
    const val = { ...this.moduleForm.value, id: this.selectedId || Date.now() };

    this.api.post('/v1/admin/modules/save', val).subscribe({
      next: (res: any) => {
        if (this.isEditMode) {
          const idx = this.moduleList.findIndex(m => m.id === this.selectedId);
          if (idx !== -1) this.moduleList[idx] = val;
        } else {
          if (res && res.data && res.data.id) val.id = res.data.id;
          this.moduleList.push(val);
        }
        this.persistState();
        this.isModuleModalOpen = false;
        this.showToast(res?.message || 'Module master entry saved successfully!', 'success');
      },
      error: (err: any) => {
        const errorMsg = err?.error?.message || err?.message || 'Backend route not found (404/500).';
        // Still update local state so UI works for offline/local demonstration
        if (this.isEditMode) {
          const idx = this.moduleList.findIndex(m => m.id === this.selectedId);
          if (idx !== -1) this.moduleList[idx] = val;
        } else {
          this.moduleList.push(val);
        }
        this.persistState();
        this.isModuleModalOpen = false;
        this.showToast(`Saved locally! Backend API Note: ${errorMsg}`, 'error');
      }
    });
  }

  deleteModule(id: number): void {
    if (confirm('Delete this module? (Submodules and buttons will also be deleted)')) {
      this.api.post('/v1/admin/modules/delete', { id }).subscribe({
        next: (res: any) => {
          this.moduleList = this.moduleList.filter(m => m.id !== id);
          this.submoduleList = this.submoduleList.filter(s => s.moduleId !== id);
          this.buttonList = this.buttonList.filter(b => b.moduleId !== id);
          this.persistState();
          this.showToast(res?.message || 'Module deleted successfully.', 'success');
        },
        error: (err: any) => {
          this.moduleList = this.moduleList.filter(m => m.id !== id);
          this.submoduleList = this.submoduleList.filter(s => s.moduleId !== id);
          this.buttonList = this.buttonList.filter(b => b.moduleId !== id);
          this.persistState();
          const errorMsg = err?.error?.message || err?.message || 'Server error';
          this.showToast(`Deleted locally! Backend API Note: ${errorMsg}`, 'error');
        }
      });
    }
  }

  // Submodule Master Modals
  openAddSubmoduleModal(): void {
    this.isEditMode = false;
    this.selectedId = null;
    const firstModId = this.moduleList[0]?.id || 1;
    this.submoduleForm.reset({ moduleId: firstModId, status: 'ACTIVE' });
    this.isSubmoduleModalOpen = true;
  }

  openEditSubmoduleModal(sub: SubmoduleMaster): void {
    this.isEditMode = true;
    this.selectedId = sub.id;
    this.submoduleForm.patchValue(sub);
    this.isSubmoduleModalOpen = true;
  }

  saveSubmodule(): void {
    if (this.submoduleForm.invalid) return;
    const val = { ...this.submoduleForm.value, id: this.selectedId || Date.now(), moduleId: Number(this.submoduleForm.value.moduleId) };

    this.api.post('/v1/admin/submodules/save', val).subscribe({
      next: (res: any) => {
        if (this.isEditMode) {
          const idx = this.submoduleList.findIndex(s => s.id === this.selectedId);
          if (idx !== -1) this.submoduleList[idx] = val;
        } else {
          if (res && res.data && res.data.id) val.id = res.data.id;
          this.submoduleList.push(val);
        }
        this.persistState();
        this.isSubmoduleModalOpen = false;
        this.showToast(res?.message || 'Submodule master entry saved successfully!', 'success');
      },
      error: (err: any) => {
        const errorMsg = err?.error?.message || err?.message || 'Backend route not found (404/500).';
        if (this.isEditMode) {
          const idx = this.submoduleList.findIndex(s => s.id === this.selectedId);
          if (idx !== -1) this.submoduleList[idx] = val;
        } else {
          this.submoduleList.push(val);
        }
        this.persistState();
        this.isSubmoduleModalOpen = false;
        this.showToast(`Saved locally! Backend API Note: ${errorMsg}`, 'error');
      }
    });
  }

  deleteSubmodule(id: number): void {
    if (confirm('Delete this submodule?')) {
      this.api.post('/v1/admin/submodules/delete', { id }).subscribe({
        next: (res: any) => {
          this.submoduleList = this.submoduleList.filter(s => s.id !== id);
          this.buttonList = this.buttonList.filter(b => b.submoduleId !== id);
          this.persistState();
          this.showToast(res?.message || 'Submodule deleted successfully.', 'success');
        },
        error: (err: any) => {
          this.submoduleList = this.submoduleList.filter(s => s.id !== id);
          this.buttonList = this.buttonList.filter(b => b.submoduleId !== id);
          this.persistState();
          const errorMsg = err?.error?.message || err?.message || 'Server error';
          this.showToast(`Deleted locally! Backend API Note: ${errorMsg}`, 'error');
        }
      });
    }
  }

  // Button Master Modals
  openAddButtonModal(): void {
    this.isEditMode = false;
    this.selectedId = null;
    const firstMod = this.moduleList[0]?.id || 1;
    const subs = this.getSubmodulesForModule(firstMod);
    const firstSub = subs[0]?.id || 101;
    this.buttonForm.reset({
      moduleId: firstMod,
      submoduleId: firstSub,
      actionType: 'BUTTON',
      status: 'ACTIVE'
    });
    this.isButtonModalOpen = true;
  }

  openEditButtonModal(btn: ButtonMaster): void {
    this.isEditMode = true;
    this.selectedId = btn.id;
    this.buttonForm.patchValue(btn);
    this.isButtonModalOpen = true;
  }

  onButtonModalModuleChange(): void {
    const modId = Number(this.buttonForm.get('moduleId')?.value);
    const subs = this.getSubmodulesForModule(modId);
    if (subs.length > 0) {
      this.buttonForm.patchValue({ submoduleId: subs[0].id });
    }
    this.autoGenerateButtonCode();
  }

  autoGenerateButtonCode(): void {
    const modId = Number(this.buttonForm.get('moduleId')?.value);
    const subId = Number(this.buttonForm.get('submoduleId')?.value);
    const btnName = this.buttonForm.get('buttonName')?.value || 'BTN';

    const mod = this.moduleList.find(m => Number(m.id) === modId);
    const sub = this.submoduleList.find(s => Number(s.id) === subId);

    const mCode = (mod?.moduleCode || 'MOD').toUpperCase();
    const sCode = (sub?.submoduleCode || 'SUB').toUpperCase();
    const bCode = btnName.toUpperCase().replace(/[^A-Z0-9]/g, '_');

    this.buttonForm.patchValue({
      buttonCode: `${mCode}:${sCode}:${bCode}`
    }, { emitEvent: false });
  }

  saveButton(): void {
    if (this.buttonForm.invalid) return;
    const val = {
      ...this.buttonForm.value,
      id: this.selectedId || Date.now(),
      moduleId: Number(this.buttonForm.value.moduleId),
      submoduleId: Number(this.buttonForm.value.submoduleId)
    };

    this.api.post('/v1/admin/permissions/save', val).subscribe({
      next: (res: any) => {
        if (this.isEditMode) {
          const idx = this.buttonList.findIndex(b => b.id === this.selectedId);
          if (idx !== -1) this.buttonList[idx] = val;
        } else {
          if (res && res.data && res.data.id) val.id = res.data.id;
          this.buttonList.push(val);
        }
        this.persistState();
        this.isButtonModalOpen = false;
        this.showToast(res?.message || 'Button master entry saved successfully!', 'success');
      },
      error: (err: any) => {
        const errorMsg = err?.error?.message || err?.message || 'Backend route not found (404/500).';
        if (this.isEditMode) {
          const idx = this.buttonList.findIndex(b => b.id === this.selectedId);
          if (idx !== -1) this.buttonList[idx] = val;
        } else {
          this.buttonList.push(val);
        }
        this.persistState();
        this.isButtonModalOpen = false;
        this.showToast(`Saved locally! Backend API Note: ${errorMsg}`, 'error');
      }
    });
  }

  deleteButton(id: number): void {
    if (confirm('Delete this button master entry?')) {
      this.api.post('/v1/admin/permissions/delete', { id }).subscribe({
        next: (res: any) => {
          this.buttonList = this.buttonList.filter(b => b.id !== id);
          this.persistState();
          this.showToast(res?.message || 'Button deleted successfully.', 'success');
        },
        error: (err: any) => {
          this.buttonList = this.buttonList.filter(b => b.id !== id);
          this.persistState();
          const errorMsg = err?.error?.message || err?.message || 'Server error';
          this.showToast(`Deleted locally! Backend API Note: ${errorMsg}`, 'error');
        }
      });
    }
  }

  // Role Matrix & User Overrides Logic
  get selectedRole(): RolePermissionMap | undefined {
    return this.roleList.find(r => r.roleCode === this.selectedRoleCode);
  }

  get selectedUserOverride(): UserPermissionOverride | undefined {
    return this.userList.find(u => Number(u.userId) === Number(this.selectedUserId));
  }

  onUserSelectChange(): void {
    this.selectedUserId = Number(this.selectedUserId);
  }

  isPermissionGrantedToRole(btnCode: string): boolean {
    const r = this.selectedRole;
    return r ? r.assignedButtonCodes.includes(btnCode) : false;
  }

  toggleRolePermission(btnCode: string): void {
    const r = this.selectedRole;
    if (!r) return;
    const idx = r.assignedButtonCodes.indexOf(btnCode);
    if (idx !== -1) r.assignedButtonCodes.splice(idx, 1);
    else r.assignedButtonCodes.push(btnCode);
    this.persistState();
  }

  grantAllForRole(): void {
    const r = this.selectedRole;
    if (!r) return;
    r.assignedButtonCodes = this.buttonList.map(b => b.buttonCode);
    this.persistState();
    this.showToast(`Granted all buttons to ${r.roleName}`, 'success');
  }

  revokeAllForRole(): void {
    const r = this.selectedRole;
    if (!r) return;
    r.assignedButtonCodes = [];
    this.persistState();
    this.showToast(`Revoked all buttons from ${r.roleName}`, 'error');
  }

  getGrantedCountForModuleRole(modId: number): number {
    const r = this.selectedRole;
    if (!r) return 0;
    const modButtons = this.buttonList.filter(b => Number(b.moduleId) === Number(modId)).map(b => b.buttonCode);
    return modButtons.filter(code => r.assignedButtonCodes.includes(code)).length;
  }

  // User Overrides
  isRolePermissionDefaultGranted(btnCode: string): boolean {
    const user = this.selectedUserOverride;
    if (!user) return false;
    const r = this.roleList.find(role => role.roleCode === user.roleCode);
    return r ? r.assignedButtonCodes.includes(btnCode) : false;
  }

  getUserOverrideStatus(btnCode: string): 'DEFAULT' | 'GRANT' | 'DENY' {
    const user = this.selectedUserOverride;
    if (!user || !user.overrides) return 'DEFAULT';
    return user.overrides[btnCode] || 'DEFAULT';
  }

  setUserOverrideStatus(btnCode: string, status: 'DEFAULT' | 'GRANT' | 'DENY'): void {
    const user = this.selectedUserOverride;
    if (!user) return;
    if (!user.overrides) user.overrides = {};
    if (status === 'DEFAULT') delete user.overrides[btnCode];
    else user.overrides[btnCode] = status;
    this.persistState();
  }

  getFinalEffectiveText(btnCode: string): string {
    const override = this.getUserOverrideStatus(btnCode);
    if (override === 'GRANT') return '✓ Granted (User Override)';
    if (override === 'DENY') return '✖ Denied (User Override)';
    const roleGranted = this.isRolePermissionDefaultGranted(btnCode);
    return roleGranted ? '✓ Granted (Role Inherited)' : '✖ Denied (Role Inherited)';
  }

  getFinalEffectiveBadgeClass(btnCode: string): string {
    const text = this.getFinalEffectiveText(btnCode);
    return text.startsWith('✓') ? 'badge badge-active' : 'badge badge-inactive';
  }

  saveRoleMatrix(): void {
    this.persistState();
    this.api.post('/v1/admin/roles/permissions/save', { roleList: this.roleList }).subscribe({
      next: (res: any) => {
        this.showToast(res?.message || 'Role permission matrix saved successfully!', 'success');
      },
      error: (err: any) => {
        const errorMsg = err?.error?.message || err?.message || 'Backend route not found (404/500).';
        this.showToast(`Saved locally! Backend API Note: ${errorMsg}`, 'error');
      }
    });
  }

  saveUserOverrides(): void {
    this.persistState();
    this.api.post('/v1/admin/users/permissions/save', { userList: this.userList }).subscribe({
      next: (res: any) => {
        this.showToast(res?.message || 'User-specific permission overrides saved successfully!', 'success');
      },
      error: (err: any) => {
        const errorMsg = err?.error?.message || err?.message || 'Backend route not found (404/500).';
        this.showToast(`Saved locally! Backend API Note: ${errorMsg}`, 'error');
      }
    });
  }

  getBadgeClass(status: string): string {
    return String(status || '').toUpperCase().includes('ACTIVE') ? 'badge badge-active' : 'badge badge-inactive';
  }

  getTypeBadgeClass(type: string): string {
    const t = String(type || '').toUpperCase();
    if (t === 'BUTTON') return 'badge badge-button';
    if (t === 'ACTION') return 'badge badge-action';
    if (t === 'VIEW') return 'badge badge-view';
    return 'badge badge-export';
  }
}
