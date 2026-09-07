import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';
import { AuthStateService } from 'src/app/core/state/auth-state.service';

@Component({
  selector: 'app-shifts',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <!-- Toast Notification Overlay -->
    <div class="toast-container" *ngIf="isToastVisible" [class]="'toast-' + toastType">
      <div class="toast-content">
        <span class="toast-icon" *ngIf="toastType === 'success'">✓</span>
        <span class="toast-icon" *ngIf="toastType === 'error'">✖</span>
        <span class="toast-text">{{ toastMessage }}</span>
      </div>
      <button class="toast-close" (click)="isToastVisible = false">&times;</button>
    </div>

    <!-- EMPLOYEE VIEW: My Assigned Shift & Week-Off Schedule (Shown when user lacks full roster view permissions) -->
    <div *ngIf="!canViewAllRosters()" class="glass-card mb-4">
      <div class="header-actions">
        <div class="title-group">
          <h2>🕒 My Work Shift & Week-Off Schedule</h2>
          <p>View your assigned work shift timings, weekly off days, and active roster details</p>
        </div>
        <div class="action-buttons">
          <button class="btn-secondary" (click)="loadHRRosterSummary()">🔄 Refresh Schedule</button>
        </div>
      </div>

      <div class="employee-shift-grid" *ngIf="myShiftDetails as my">
        <div class="shift-info-card primary">
          <div class="card-icon">🕒</div>
          <div class="card-content">
            <span class="card-label">Assigned Shift</span>
            <h3 class="card-val">{{ my.shiftName || 'General Day Shift' }}</h3>
            <p class="card-sub">{{ my.shiftTiming || '09:30 AM - 06:30 PM' }}</p>
          </div>
        </div>

        <div class="shift-info-card accent">
          <div class="card-icon">📅</div>
          <div class="card-content">
            <span class="card-label">Weekly Off Days</span>
            <h3 class="card-val">{{ my.weekOffDay1 || 'SATURDAY' }} & {{ my.weekOffDay2 || 'SUNDAY' }}</h3>
            <p class="card-sub">Fixed Weekly Rest Period</p>
          </div>
        </div>

        <div class="shift-info-card info">
          <div class="card-icon">🔄</div>
          <div class="card-content">
            <span class="card-label">Roster Status</span>
            <h3 class="card-val">{{ formatRosterType(my.rosterType) }}</h3>
            <p class="card-sub">{{ my.isAutoRollover ? 'Auto-Rollover Active' : 'Static Schedule' }}</p>
          </div>
        </div>
      </div>

      <div class="my-details-table-wrapper mt-4">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Department</th>
              <th>Assigned Shift</th>
              <th>1st Week-Off</th>
              <th>2nd Week-Off</th>
              <th>Effective Schedule</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="myShiftDetails as my">
              <td>
                <div class="emp-profile-cell">
                  <div class="avatar-pill">{{ getInitials(my.employeeName) }}</div>
                  <div>
                    <div class="emp-name">{{ my.employeeName }}</div>
                    <div class="emp-subtext">{{ my.employeeCode }}</div>
                  </div>
                </div>
              </td>
              <td>{{ my.department || 'N/A' }}</td>
              <td>
                <span class="shift-badge">
                  🕒 {{ my.shiftName }} ({{ my.shiftTiming }})
                </span>
              </td>
              <td><span class="weekoff-badge w1">{{ my.weekOffDay1 }}</span></td>
              <td><span class="weekoff-badge w2">{{ my.weekOffDay2 }}</span></td>
              <td>
                <span *ngIf="my.startDate" class="date-range-text">{{ my.startDate }} ➔ {{ my.endDate }}</span>
                <span *ngIf="!my.startDate" class="text-muted">Standard Company Policy</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- HR / ADMIN / MANAGER / PERMITTED VIEW: Full Shift & Roster Management Tabs -->
    <ng-container *ngIf="canViewAllRosters()">
      <!-- Navigation Tabs -->
      <div class="tab-header mb-4">
        <button class="tab-btn" [class.active]="activeTab === 'rosterList'" (click)="setTab('rosterList')">
          👥 HR Employee Shift & Week-Off Roster
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'shiftMaster'" (click)="setTab('shiftMaster')">
          🕒 Work Shifts Master
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'rosterHistory'" (click)="setTab('rosterHistory')">
          📅 Roster Schedules & History
        </button>
      </div>

      <!-- TAB 1: HR Employee Roster & Week-Off Master List -->
      <div *ngIf="activeTab === 'rosterList'" class="glass-card mb-4">
      <div class="header-actions">
        <div class="title-group">
          <h2>👥 HR Employee Shift & Week-Off Master</h2>
          <p>Complete list of all employees with assigned shifts, week-offs, active rosters, and auto-rollover rules</p>
        </div>
        <div class="action-buttons">
          <button class="btn-primary" *ngIf="canAssignRoster()" (click)="openAssignRosterModal()">
            <span>📅</span> Create / Assign Roster
          </button>
        </div>
      </div>

      <!-- Filters & Search -->
      <div class="filter-toolbar">
        <div class="search-input-wrapper">
          <input
            type="text"
            class="search-input"
            placeholder="Search employee, dept, shift, week-off..."
            [(ngModel)]="rosterSearchQuery"
            (input)="filterRosterSummary()"
          />
        </div>

        <div class="filter-group">
          <select class="filter-select" [(ngModel)]="filterShiftId" (change)="filterRosterSummary()">
            <option [value]="'ALL'">All Shifts</option>
            <option *ngFor="let s of items" [value]="s.id">{{ s.shiftName }}</option>
          </select>

          <select class="filter-select" [(ngModel)]="filterWeekOff" (change)="filterRosterSummary()">
            <option value="ALL">All Week-Off Days</option>
            <option value="SUNDAY">Sunday</option>
            <option value="SATURDAY">Saturday</option>
            <option value="FRIDAY">Friday</option>
            <option value="MONDAY">Monday</option>
          </select>

          <button class="btn-secondary" (click)="loadHRRosterSummary()">🔄 Refresh List</button>
        </div>
      </div>

      <!-- HR Employee Roster Table -->
      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th class="sticky-col col-1">Emp Code</th>
              <th class="sticky-col col-2">Employee Name</th>
              <th class="sticky-col col-3">Department</th>
              <th>Assigned Shift</th>
              <th>1st Week-Off</th>
              <th>2nd Week-Off</th>
              <th>Roster Duration</th>
              <th>Effective Dates</th>
              <th>Auto-Rollover</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let emp of filteredRosterSummary">
              <td class="sticky-col col-1"><strong>{{ emp?.employeeCode }}</strong></td>
              <td class="sticky-col col-2">
                <div class="emp-profile-cell">
                  <div class="avatar-pill">{{ getInitials(emp?.employeeName) }}</div>
                  <div>
                    <div class="emp-name">{{ emp?.employeeName }}</div>
                    <div class="emp-subtext">{{ emp?.designation }}</div>
                  </div>
                </div>
              </td>
              <td class="sticky-col col-3">{{ emp?.department || 'N/A' }}</td>
              <td>
                <span class="shift-badge">
                  🕒 {{ emp?.shiftName || 'General Shift' }}
                  <span class="shift-time">{{ emp?.shiftTiming || '09:30 - 18:30' }}</span>
                </span>
              </td>
              <td><span class="weekoff-badge w1">{{ emp?.weekOffDay1 || 'SATURDAY' }}</span></td>
              <td>
                <span class="weekoff-badge w2" [class.none]="emp?.weekOffDay2 === 'NONE'">
                  {{ emp?.weekOffDay2 || 'SUNDAY' }}
                </span>
              </td>
              <td>
                <span [class]="getRosterTypeClass(emp?.rosterType)">
                  {{ formatRosterType(emp?.rosterType) }}
                </span>
              </td>
              <td>
                <span *ngIf="emp?.startDate" class="date-range-text">
                  {{ emp?.startDate }} ➔ {{ emp?.endDate }}
                </span>
                <span *ngIf="!emp?.startDate" class="text-muted">Profile Default</span>
              </td>
              <td>
                <span *ngIf="emp?.isAutoRollover" class="rollover-pill active" title="Roster automatically rolls over to next week/month if no new roster is created">
                  🔄 Auto-Rollover Active
                </span>
                <span *ngIf="!emp?.isAutoRollover" class="rollover-pill static">
                  📌 Static Roster
                </span>
              </td>
              <td style="text-align: right;">
                <div class="btn-group-right">
                  <button class="btn-secondary sm" (click)="openQuickEditModal(emp)">✏️ Edit</button>
                  <button class="btn-primary sm" (click)="openSingleRosterModal(emp)">📅 Roster</button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!filteredRosterSummary || filteredRosterSummary.length === 0">
              <td colspan="10" class="empty-state">
                No employee records matching filter criteria found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 2: Work Shifts Master -->
    <div *ngIf="activeTab === 'shiftMaster'" class="glass-card mb-4">
      <div class="header-actions">
        <div class="title-group">
          <h2>🕒 Work Shifts Master</h2>
          <p>Define standard company shift timings, break durations, and active status</p>
        </div>
        <div class="action-buttons" style="display: flex; gap: 0.5rem;">
          <button class="btn-secondary" (click)="loadRecords()">🔄 Refresh List</button>
          <button class="btn-primary" (click)="openAddModal()">
            <span>+</span> Add New Shift
          </button>
        </div>
      </div>

      <div class="filter-toolbar">
        <div class="search-input-wrapper">
          <input
            type="text"
            class="search-input"
            placeholder="Search shifts by code, name, timings..."
            [(ngModel)]="searchQuery"
            (input)="filterRecords()"
          />
        </div>
      </div>

      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Shift Code</th>
              <th>Shift Name</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Break (Mins)</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of filteredItems">
              <td><strong>{{ item?.shiftCode }}</strong></td>
              <td>{{ item?.shiftName }}</td>
              <td>{{ item?.startTime }}</td>
              <td>{{ item?.endTime }}</td>
              <td>{{ item?.breakDurationMinutes }} mins</td>
              <td><span [class]="getBadgeClass(item?.status)">{{ item?.status || 'ACTIVE' }}</span></td>
              <td style="text-align: right;">
                <button class="btn-secondary sm" style="margin-right: 0.5rem;" (click)="openEditModal(item)">Edit</button>
                <button class="btn-danger sm" (click)="deleteRecord(item)">Delete</button>
              </td>
            </tr>
            <tr *ngIf="!filteredItems || filteredItems.length === 0">
              <td colspan="7" class="empty-state">
                No shift records found. Click "+ Add New Shift" to create one.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 3: Roster Schedules & History -->
    <div *ngIf="activeTab === 'rosterHistory'" class="glass-card mb-4">
      <div class="header-actions">
        <div class="title-group">
          <h2>📅 Active Roster History & Schedules</h2>
          <p>Log of created weekly, monthly, and 3-month rosters assigned across departments</p>
        </div>
        <button class="btn-primary" (click)="openAssignRosterModal()">
          <span>+</span> Create Roster Schedule
        </button>
      </div>

      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Roster ID</th>
              <th>Employee Name</th>
              <th>Roster Type</th>
              <th>Shift</th>
              <th>1st Week-Off</th>
              <th>2nd Week-Off</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Auto-Rollover</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of rosterHistoryList">
              <td>#RST-{{ r?.id }}</td>
              <td>{{ r?.employee?.firstName }} {{ r?.employee?.lastName }} ({{ r?.employee?.employeeCode }})</td>
              <td><span [class]="getRosterTypeClass(r?.rosterType)">{{ formatRosterType(r?.rosterType) }}</span></td>
              <td>{{ r?.shift?.shiftName || 'General Shift' }}</td>
              <td><span class="weekoff-badge w1">{{ r?.weekOffDay1 }}</span></td>
              <td><span class="weekoff-badge w2">{{ r?.weekOffDay2 }}</span></td>
              <td>{{ r?.startDate }}</td>
              <td>{{ r?.endDate }}</td>
              <td>
                <span *ngIf="r?.isAutoRollover" class="rollover-pill active">🔄 Yes</span>
                <span *ngIf="!r?.isAutoRollover" class="rollover-pill static">📌 No</span>
              </td>
              <td style="text-align: right;">
                <button class="btn-danger sm" (click)="deleteRosterRecord(r?.id)">Deactivate</button>
              </td>
            </tr>
            <tr *ngIf="!rosterHistoryList || rosterHistoryList.length === 0">
              <td colspan="10" class="empty-state">
                No custom roster schedule entries found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL 1: Create / Assign Roster Modal (Weekly, Monthly, 3 Months) -->
    <div class="modal-backdrop" *ngIf="isRosterModalOpen">
      <div class="modal-card wide">
        <div class="modal-header">
          <div>
            <h3>📅 Assign Employee Roster Schedule</h3>
            <p class="modal-subtitle">Configure 1-Week, 1-Month, or 3-Month roster with automatic rollover rule</p>
          </div>
          <button class="close-btn" (click)="closeRosterModal()">&times;</button>
        </div>

        <div class="modal-body">
          <div class="form-grid">
            <!-- Target Selection Mode -->
            <div class="form-group full-width">
              <label>Assign Target</label>
              <div class="radio-pill-group">
                <label class="radio-pill" [class.selected]="rosterAssignMode === 'SINGLE'">
                  <input type="radio" name="assignMode" value="SINGLE" [(ngModel)]="rosterAssignMode" />
                  Single Employee
                </label>
                <label class="radio-pill" [class.selected]="rosterAssignMode === 'BULK'">
                  <input type="radio" name="assignMode" value="BULK" [(ngModel)]="rosterAssignMode" />
                  Bulk / All Employees
                </label>
              </div>
            </div>

            <!-- Employee Dropdown (Single Mode) -->
            <div class="form-group" *ngIf="rosterAssignMode === 'SINGLE'">
              <label>Select Employee *</label>
              <select class="form-control" [(ngModel)]="selectedRosterEmpId">
                <option [value]="null">-- Select Employee --</option>
                <option *ngFor="let emp of employees" [value]="emp.id">
                  {{ emp.employeeCode }} - {{ emp.firstName }} {{ emp.lastName }} ({{ emp.department?.departmentName || 'Dept' }})
                </option>
              </select>
            </div>

            <!-- Bulk Employee Multi-Selector (Bulk Mode) -->
            <div class="form-group full-width" *ngIf="rosterAssignMode === 'BULK'">
              <div class="bulk-select-header">
                <label>
                  Select Employees for Roster
                  <span class="selected-count-badge">
                    {{ selectedBulkEmpIds.length }} of {{ employees.length }} Selected
                  </span>
                </label>
                <div class="bulk-action-btns">
                  <button type="button" class="btn-secondary sm" (click)="selectAllBulkEmployees()">Select All</button>
                  <button type="button" class="btn-secondary sm" (click)="deselectAllBulkEmployees()">Deselect All</button>
                </div>
              </div>

              <div class="bulk-search-wrapper">
                <input
                  type="text"
                  class="form-control sm"
                  placeholder="🔍 Search employees by name, code, department..."
                  [(ngModel)]="bulkSearchQuery"
                />
              </div>

              <div class="bulk-employee-list">
                <div 
                  class="emp-checkbox-item" 
                  *ngFor="let emp of getFilteredBulkEmployees()" 
                  [class.selected]="isBulkEmpSelected(emp.id)"
                  (click)="toggleBulkEmpSelection(emp.id)"
                >
                  <input
                    type="checkbox"
                    [checked]="isBulkEmpSelected(emp.id)"
                    (change)="$event.stopPropagation(); toggleBulkEmpSelection(emp.id)"
                  />
                  <div class="avatar-pill sm">{{ getInitials(emp.firstName + ' ' + (emp.lastName || '')) }}</div>
                  <div class="emp-checkbox-info">
                    <span class="emp-code">{{ emp.employeeCode }}</span>
                    <span class="emp-name">{{ emp.firstName }} {{ emp.lastName }}</span>
                    <span class="emp-dept" *ngIf="emp.department?.departmentName">({{ emp.department.departmentName }})</span>
                  </div>
                </div>
                <div *ngIf="getFilteredBulkEmployees().length === 0" class="text-muted p-2" style="font-size: 0.8rem; text-align: center;">
                  No employees found matching search filter.
                </div>
              </div>
            </div>

            <!-- Roster Duration Type -->
            <div class="form-group">
              <label>Roster Duration Type *</label>
              <select class="form-control" [(ngModel)]="rosterType" (change)="recalculateEndDate()">
                <option value="WEEKLY">📅 1 Week (Weekly Roster)</option>
                <option value="MONTHLY">📅 1 Month (Monthly Roster)</option>
                <option value="THREE_MONTHS">📅 3 Months (Quarterly Roster)</option>
              </select>
            </div>

            <!-- Start Date -->
            <div class="form-group">
              <label>Roster Start Date *</label>
              <input type="date" class="form-control" [(ngModel)]="rosterStartDate" (change)="recalculateEndDate()" />
            </div>

            <!-- Calculated End Date Display -->
            <div class="form-group">
              <label>Calculated End Date</label>
              <div class="calc-date-box">
                🗓️ {{ rosterEndDate || 'Select start date' }}
              </div>
            </div>

            <!-- Shift Selection -->
            <div class="form-group">
              <label>Assigned Shift *</label>
              <select class="form-control" [(ngModel)]="rosterShiftId">
                <option [value]="null">-- Select Shift --</option>
                <option *ngFor="let s of items" [value]="s.id">
                  {{ s.shiftName }} ({{ s.startTime }} - {{ s.endTime }})
                </option>
              </select>
            </div>

            <!-- 1st Week Off -->
            <div class="form-group">
              <label>First Week-Off Day *</label>
              <select class="form-control" [(ngModel)]="rosterWeekOff1">
                <option value="SATURDAY">Saturday</option>
                <option value="SUNDAY">Sunday</option>
                <option value="FRIDAY">Friday</option>
                <option value="MONDAY">Monday</option>
                <option value="TUESDAY">Tuesday</option>
                <option value="WEDNESDAY">Wednesday</option>
                <option value="THURSDAY">Thursday</option>
              </select>
            </div>

            <!-- 2nd Week Off -->
            <div class="form-group">
              <label>Second Week-Off Day</label>
              <select class="form-control" [(ngModel)]="rosterWeekOff2">
                <option value="SUNDAY">Sunday</option>
                <option value="SATURDAY">Saturday</option>
                <option value="FRIDAY">Friday</option>
                <option value="MONDAY">Monday</option>
                <option value="TUESDAY">Tuesday</option>
                <option value="WEDNESDAY">Wednesday</option>
                <option value="THURSDAY">Thursday</option>
                <option value="NONE">None (Single Week-Off)</option>
              </select>
            </div>

            <!-- Auto-Rollover Rule Checkbox -->
            <div class="form-group full-width">
              <label class="checkbox-container">
                <input type="checkbox" [(ngModel)]="rosterIsAutoRollover" />
                <span class="checkmark"></span>
                <span class="checkbox-label">
                  <strong>🔄 Enable Auto-Rollover Rule</strong>
                  <small style="display: block; color: #94a3b8; margin-top: 0.15rem;">
                    If enabled, if HR does NOT create a new roster for the next period, this SAME roster will automatically roll over and apply to the employee for subsequent weeks, next month, and 3 months!
                  </small>
                </span>
              </label>
            </div>

            <!-- Remarks -->
            <div class="form-group full-width">
              <label>Remarks / Notes</label>
              <input type="text" class="form-control" placeholder="e.g. Q3 Shift Roster Schedule" [(ngModel)]="rosterRemarks" />
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" (click)="closeRosterModal()">Cancel</button>
          <button type="button" class="btn-primary" (click)="saveRosterSchedule()">
            💾 Apply Roster Schedule
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 2: Quick Edit Employee Shift & Week-Off Modal -->
    <div class="modal-backdrop" *ngIf="isQuickEditModalOpen">
      <div class="modal-card">
        <div class="modal-header">
          <h3>✏️ Quick Edit Employee Config</h3>
          <button class="close-btn" (click)="isQuickEditModalOpen = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="emp-info-banner mb-3">
            <strong>{{ quickEditEmpName }}</strong> ({{ quickEditEmpCode }})
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label>Assigned Shift</label>
              <select class="form-control" [(ngModel)]="quickEditShiftId">
                <option [value]="null">-- Select Shift --</option>
                <option *ngFor="let s of items" [value]="s.id">
                  {{ s.shiftName }} ({{ s.startTime }} - {{ s.endTime }})
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>First Week-Off</label>
              <select class="form-control" [(ngModel)]="quickEditWeekOff1">
                <option value="SATURDAY">Saturday</option>
                <option value="SUNDAY">Sunday</option>
                <option value="FRIDAY">Friday</option>
                <option value="MONDAY">Monday</option>
                <option value="TUESDAY">Tuesday</option>
                <option value="WEDNESDAY">Wednesday</option>
                <option value="THURSDAY">Thursday</option>
              </select>
            </div>

            <div class="form-group">
              <label>Second Week-Off</label>
              <select class="form-control" [(ngModel)]="quickEditWeekOff2">
                <option value="SUNDAY">Sunday</option>
                <option value="SATURDAY">Saturday</option>
                <option value="FRIDAY">Friday</option>
                <option value="MONDAY">Monday</option>
                <option value="TUESDAY">Tuesday</option>
                <option value="WEDNESDAY">Wednesday</option>
                <option value="THURSDAY">Thursday</option>
                <option value="NONE">None (Single Week-Off)</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" (click)="isQuickEditModalOpen = false">Cancel</button>
          <button type="button" class="btn-primary" (click)="saveQuickEditConfig()">
            💾 Save Configuration
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 3: Add/Edit Shift Modal -->
    <div class="modal-backdrop" *ngIf="isModalOpen">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ isEditMode ? 'Edit Shift' : 'Create New Shift' }}</h3>
          <button class="close-btn" (click)="closeModal()">&times;</button>
        </div>
        <form [formGroup]="recordForm" (ngSubmit)="saveRecord()">
          <div class="form-grid">
            <div class="form-group">
              <label for="shiftCode">Shift Code</label>
              <input id="shiftCode" type="text" formControlName="shiftCode" class="form-control" placeholder="e.g. SFT-GEN" />
            </div>
            <div class="form-group">
              <label for="shiftName">Shift Name</label>
              <input id="shiftName" type="text" formControlName="shiftName" class="form-control" placeholder="e.g. General Day Shift" />
            </div>
            <div class="form-group">
              <label for="startTime">Start Time</label>
              <input id="startTime" type="text" formControlName="startTime" class="form-control" placeholder="e.g. 09:00 AM" />
            </div>
            <div class="form-group">
              <label for="endTime">End Time</label>
              <input id="endTime" type="text" formControlName="endTime" class="form-control" placeholder="e.g. 06:00 PM" />
            </div>
            <div class="form-group">
              <label for="breakDurationMinutes">Break (Mins)</label>
              <input id="breakDurationMinutes" type="text" formControlName="breakDurationMinutes" class="form-control" placeholder="e.g. 60" />
            </div>
            <div class="form-group">
              <label for="status">Status</label>
              <select id="status" formControlName="status" class="form-control">
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" (click)="closeModal()">Cancel</button>
            <button type="submit" class="btn-primary" [disabled]="recordForm.invalid">
              {{ isEditMode ? 'Update' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    </ng-container>

    <!-- MODAL 4: Dynamic Custom Confirm Modal (Replaces Native Browser confirm) -->
    <div class="modal-backdrop confirm-backdrop" *ngIf="isConfirmModalOpen" (click)="closeConfirmDialog()">
      <div class="modal-card confirm-modal" (click)="$event.stopPropagation()">
        <div class="confirm-icon-wrapper">
          <span class="confirm-icon">⚠️</span>
        </div>
        <div class="confirm-content">
          <h3 class="confirm-title">{{ confirmTitle }}</h3>
          <p class="confirm-message">{{ confirmMessage }}</p>
        </div>
        <div class="modal-footer confirm-footer">
          <button type="button" class="btn-secondary" (click)="closeConfirmDialog()">Cancel</button>
          <button
            type="button"
            [class]="confirmActionType === 'danger' ? 'btn-danger' : 'btn-primary'"
            (click)="executeConfirmAction()"
          >
            {{ confirmActionText }}
          </button>
        </div>
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
  .employee-shift-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1.25rem;
    margin-top: 1rem;
  }
  .shift-info-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    padding: 1.25rem;
    display: flex;
    align-items: center;
    gap: 1.25rem;
    backdrop-filter: blur(10px);
  }
  .shift-info-card.primary { border-color: rgba(168, 85, 247, 0.4); background: rgba(137, 30, 162, 0.15); }
  .shift-info-card.accent { border-color: rgba(59, 130, 246, 0.4); background: rgba(37, 99, 235, 0.15); }
  .shift-info-card.info { border-color: rgba(16, 185, 129, 0.4); background: rgba(5, 150, 105, 0.15); }
  .card-icon {
    font-size: 2rem;
    width: 52px;
    height: 52px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .card-label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
  .card-val { font-size: 1.15rem; font-weight: 700; color: #ffffff; margin: 0.2rem 0; }
  .card-sub { font-size: 0.8rem; color: #cbd5e1; margin: 0; }
  .confirm-backdrop {
    z-index: 10000;
    background: rgba(15, 23, 42, 0.6);
  }
  .confirm-modal {
    max-width: 440px;
    padding: 1.75rem;
    text-align: center;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
    border-radius: 16px;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    animation: confirmPop 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  @keyframes confirmPop {
    from { opacity: 0; transform: scale(0.88) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  .confirm-icon-wrapper {
    width: 60px;
    height: 60px;
    margin: 0 auto 1rem auto;
    border-radius: 50%;
    background: #fee2e2;
    border: 1px solid #fca5a5;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
  }
  .confirm-icon {
    font-size: 1.75rem;
  }
  .confirm-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #0f172a !important;
    font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
    margin-bottom: 0.5rem;
  }
  .confirm-message {
    font-size: 0.9rem;
    color: #334155 !important;
    font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
    line-height: 1.5;
    margin-bottom: 1.5rem;
  }
  .confirm-footer {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
  }
  .toast-container {
    position: fixed;
    top: 1.5rem;
    right: 1.5rem;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.85rem 1.25rem;
    border-radius: 12px;
    backdrop-filter: blur(12px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    font-size: 0.875rem;
    font-weight: 500;
  }
  .toast-success { background: rgba(20, 83, 45, 0.92); border: 1px solid rgba(34, 197, 94, 0.5); color: #f0fdf4; }
  .toast-error { background: rgba(127, 29, 29, 0.92); border: 1px solid rgba(239, 68, 68, 0.5); color: #fef2f2; }
  .toast-content { display: flex; align-items: center; gap: 0.6rem; }
  .toast-close { background: none; border: none; color: currentColor; font-size: 1.25rem; cursor: pointer; }

  /* Navigation Tabs */
  .tab-header {
    display: flex;
    gap: 0.5rem;
    border-bottom: 1px solid rgba(137, 30, 162, 0.3);
    padding-bottom: 0.5rem;
  }
  .tab-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    padding: 0.65rem 1.2rem;
    border-radius: 10px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .tab-btn.active {
    background: linear-gradient(135deg, #891EA2, #a855f7);
    color: #ffffff;
    border-color: #a855f7;
    box-shadow: 0 4px 15px rgba(137, 30, 162, 0.4);
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
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .title-group h2 {
    font-size: 1.35rem;
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

  .filter-toolbar {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .search-input-wrapper { flex: 1; min-width: 260px; }
  .search-input {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(137, 30, 162, 0.3);
    border-radius: 8px;
    padding: 0.6rem 1rem;
    color: #ffffff;
    font-size: 0.875rem;
    width: 100%;
    outline: none;
  }
  .filter-group { display: flex; gap: 0.5rem; align-items: center; }
  .filter-select {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(137, 30, 162, 0.3);
    border-radius: 8px;
    padding: 0.6rem 0.85rem;
    color: #ffffff;
    font-size: 0.85rem;
    outline: none;
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
  .btn-primary.sm { padding: 0.4rem 0.75rem; font-size: 0.8rem; }
  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(137, 30, 162, 0.6);
  }
  .btn-secondary {
    background: #f1f5f9;
    color: #0f172a !important;
    border: 1px solid #cbd5e1;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 700;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .btn-secondary.sm { padding: 0.4rem 0.75rem; font-size: 0.8rem; }
  .btn-secondary:hover { background: #e2e8f0; color: #000000 !important; }
  
  .btn-danger {
    background: #fee2e2;
    color: #991b1b !important;
    border: 1px solid #fca5a5;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 700;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .btn-danger.sm { padding: 0.35rem 0.65rem; font-size: 0.75rem; }
  .btn-danger:hover { background: #fca5a5; color: #000000 !important; }

  .btn-group-right { display: flex; gap: 0.4rem; justify-content: flex-end; }

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
    background: rgba(137, 30, 162, 0.12);
    color: #0f172a;
    font-weight: 700;
    padding: 0.85rem 1rem;
    border-bottom: 2px solid rgba(137, 30, 162, 0.25);
    white-space: nowrap;
  }
  .custom-table td {
    padding: 0.85rem 1rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    color: #1e293b;
    font-weight: 600;
    white-space: nowrap;
  }
  .custom-table tbody tr:hover {
    background: rgba(137, 30, 162, 0.06);
  }

  .sticky-col {
    position: sticky !important;
    background: #ffffff !important;
    z-index: 2;
  }
  .custom-table th.sticky-col {
    background: #f8fafc !important;
    z-index: 3;
    color: #0f172a !important;
    font-weight: 700 !important;
  }
  .custom-table tbody tr:nth-child(even) td.sticky-col {
    background: #faf5ff !important;
  }
  .custom-table tbody tr:hover td.sticky-col {
    background: #f3e8ff !important;
  }
  .col-1 { left: 0px; min-width: 90px; }
  .col-2 { left: 90px; min-width: 200px; }
  .col-3 { left: 290px; min-width: 170px; box-shadow: 4px 0 8px -2px rgba(0, 0, 0, 0.12); }

  .emp-profile-cell { display: flex; align-items: center; gap: 0.65rem; }
  .avatar-pill {
    width: 32px; height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #891EA2, #a855f7);
    color: #ffffff;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 0.75rem;
  }
  .emp-name { font-weight: 700; color: #0f172a; font-size: 0.875rem; }
  .emp-subtext { font-size: 0.75rem; color: #475569; font-weight: 600; }

  .shift-badge {
    display: inline-flex;
    flex-direction: column;
    background: #dbeafe;
    border: 1px solid #93c5fd;
    color: #1e40af;
    padding: 0.25rem 0.65rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 700;
  }
  .shift-time { font-size: 0.7rem; color: #1d4ed8; font-weight: 700; }

  .weekoff-badge {
    padding: 0.25rem 0.65rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 800 !important;
    letter-spacing: 0.3px;
    color: #0f172a !important;
  }
  .weekoff-badge.w1 { background: #fef9c3; color: #0f172a !important; border: 1px solid #fde047; }
  .weekoff-badge.w2 { background: #f3e8ff; color: #0f172a !important; border: 1px solid #d8b4fe; }
  .weekoff-badge.none { background: #f1f5f9; color: #0f172a !important; border: 1px solid #cbd5e1; }

  .roster-pill {
    padding: 0.25rem 0.65rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 800 !important;
    display: inline-block;
    color: #0f172a !important;
  }
  .roster-weekly { background: #dbeafe; color: #0f172a !important; border: 1px solid #93c5fd; }
  .roster-monthly { background: #dcfce7; color: #0f172a !important; border: 1px solid #86efac; }
  .roster-quarterly { background: #fce7f3; color: #0f172a !important; border: 1px solid #fbcfe8; }
  .roster-default { background: #f1f5f9; color: #0f172a !important; border: 1px solid #cbd5e1; }

  .rollover-pill {
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 800 !important;
    color: #0f172a !important;
  }
  .rollover-pill.active { background: #dcfce7; color: #0f172a !important; border: 1px solid #86efac; }
  .rollover-pill.static { background: #f1f5f9; color: #0f172a !important; border: 1px solid #cbd5e1; }

  .date-range-text { font-size: 0.85rem; font-family: monospace; color: #6b21a8; font-weight: 800; }

  .badge { padding: 0.25rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 800 !important; color: #0f172a !important; display: inline-block; }
  .badge-active { background: rgba(34, 197, 94, 0.25); color: #0f172a !important; border: 1px solid #86efac; }
  .badge-inactive { background: rgba(148, 163, 184, 0.25); color: #0f172a !important; border: 1px solid #cbd5e1; }
  
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
  }
  .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
  .form-group.full-width { grid-column: 1 / -1; }
  .form-group label { font-size: 0.8rem; font-weight: 700 !important; color: #0f172a !important; font-family: 'Inter', system-ui, -apple-system, sans-serif !important; }
  .form-control {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 0.6rem 0.85rem;
    color: #0f172a;
    font-size: 0.875rem;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    outline: none;
  }
  .form-control:focus { border-color: #891EA2; box-shadow: 0 0 0 3px rgba(137, 30, 162, 0.15); }

  .radio-pill-group { display: flex; gap: 0.75rem; }
  .radio-pill {
    flex: 1;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    padding: 0.65rem 1rem;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #0f172a;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
  }
  .radio-pill.selected {
    background: rgba(137, 30, 162, 0.08);
    border-color: #891EA2;
    color: #891EA2;
  }

  .bulk-select-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  .selected-count-badge {
    background: rgba(137, 30, 162, 0.1);
    border: 1px solid rgba(137, 30, 162, 0.25);
    color: #891EA2;
    padding: 0.15rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 700;
    margin-left: 0.5rem;
  }
  .bulk-action-btns { display: flex; gap: 0.4rem; }
  .bulk-search-wrapper { margin-bottom: 0.5rem; }
  .bulk-employee-list {
    max-height: 200px;
    overflow-y: auto;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    padding: 0.5rem;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 0.4rem;
  }
  .emp-checkbox-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    padding: 0.4rem 0.65rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .emp-checkbox-item:hover {
    background: rgba(137, 30, 162, 0.06);
    border-color: #a855f7;
  }
  .emp-checkbox-item.selected {
    background: rgba(137, 30, 162, 0.1);
    border-color: #891EA2;
  }
  .emp-checkbox-item input { accent-color: #891EA2; cursor: pointer; }
  .avatar-pill.sm { width: 24px; height: 24px; font-size: 0.65rem; }
  .emp-checkbox-info { display: flex; flex-direction: column; font-size: 0.75rem; line-height: 1.2; }
  .emp-checkbox-info .emp-code { font-weight: 700; color: #6b1680; font-size: 0.7rem; }
  .emp-checkbox-info .emp-name { color: #0f172a; font-weight: 600; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
  .emp-checkbox-info .emp-dept { color: #64748b; font-size: 0.68rem; }
  .form-control.sm { padding: 0.4rem 0.65rem; font-size: 0.8rem; }

  .calc-date-box {
    background: #f3e8ff;
    border: 1px solid #d8b4fe;
    padding: 0.65rem 0.85rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.875rem;
    color: #6b21a8;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }

  .checkbox-container {
    display: flex;
    align-items: flex-start;
    gap: 0.65rem;
    cursor: pointer;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    padding: 0.85rem 1rem;
    border-radius: 10px;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
  .checkbox-container input { width: 18px; height: 18px; margin-top: 0.15rem; accent-color: #22c55e; }
  .checkbox-container .checkbox-label strong { color: #0f172a; }
  .checkbox-container .checkbox-label small { color: #475569; }

  .mb-3 { margin-bottom: 1rem; }
  .mb-4 { margin-bottom: 1.5rem; }

  .modal-backdrop {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }
  .modal-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    width: 100%;
    max-width: 580px;
    padding: 1.75rem;
    box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
    max-height: 90vh;
    overflow-y: auto;
    color: #0f172a;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
  .modal-card.wide { max-width: 720px; }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.25rem;
  }
  .modal-header h3 { color: #0f172a; font-family: 'Inter', system-ui, -apple-system, sans-serif; font-weight: 700; }
  .modal-subtitle { font-size: 0.8rem; color: #475569; margin: 0.25rem 0 0 0; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
  .modal-body { margin-bottom: 1.25rem; }
  .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; }
  .close-btn { background: none; border: none; color: #64748b; font-size: 1.5rem; cursor: pointer; }
  .close-btn:hover { color: #0f172a; }
  .emp-info-banner {
    background: #f3e8ff;
    border: 1px solid #d8b4fe;
    padding: 0.6rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    color: #6b21a8;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }

  .empty-state { text-align: center; padding: 3rem 1rem; color: #64748b; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
  `]
})
export class ShiftsComponent implements OnInit {
  public authState = inject(AuthStateService);

  // Dynamic DB-Driven Permission Checks
  readonly canViewAllRosters = computed(() => 
    this.authState.hasPermission('ROSTER_VIEW_ALL') || 
    this.authState.hasPermission('SHIFT_VIEW_ALL') ||
    this.authState.isAdmin() || this.authState.isHR() || this.authState.isManager()
  );

  readonly canAssignRoster = computed(() => 
    this.authState.hasPermission('ROSTER_CREATE') || 
    this.authState.hasPermission('ROSTER_ASSIGN') ||
    this.authState.isAdmin() || this.authState.isHR()
  );

  readonly canManageShifts = computed(() => 
    this.authState.hasPermission('SHIFT_MANAGE') || 
    this.authState.hasPermission('SHIFT_CREATE') ||
    this.authState.isAdmin() || this.authState.isHR()
  );

  activeTab: 'rosterList' | 'shiftMaster' | 'rosterHistory' = 'rosterList';

  items: any[] = [];
  employees: any[] = [];
  filteredItems: any[] = [];

  get myShiftDetails(): any {
    const user = this.authState.user();
    if (user && this.hrRosterSummary && this.hrRosterSummary.length > 0) {
      const match = this.hrRosterSummary.find(
        item => (item.employeeCode && user.employeeCode && item.employeeCode === user.employeeCode) ||
                (item.employeeId && user.id && Number(item.employeeId) === Number(user.id)) ||
                (item.employeeId && user.userId && Number(item.employeeId) === Number(user.userId))
      );
      if (match) return match;
    }
    return {
      employeeCode: user?.employeeCode || 'EMP-SELF',
      employeeName: this.authState.fullName() || user?.username || 'Employee',
      department: user?.departmentName || 'General',
      designation: user?.designationName || 'Team Member',
      shiftName: 'General Day Shift',
      shiftTiming: '09:30 AM - 06:30 PM',
      breakDuration: '60 mins',
      weekOffDay1: 'SATURDAY',
      weekOffDay2: 'SUNDAY',
      rosterType: 'DEFAULT',
      startDate: null,
      endDate: null,
      isAutoRollover: true
    };
  }
  searchQuery: string = '';
  isModalOpen: boolean = false;
  isEditMode: boolean = false;
  selectedId: any = null;
  recordForm!: FormGroup;

  // HR Roster Summary State
  hrRosterSummary: any[] = [];
  filteredRosterSummary: any[] = [];
  rosterSearchQuery: string = '';
  filterShiftId: string = 'ALL';
  filterWeekOff: string = 'ALL';

  // Roster History
  rosterHistoryList: any[] = [];

  // Roster Assign Modal State
  isRosterModalOpen: boolean = false;
  rosterAssignMode: 'SINGLE' | 'BULK' = 'SINGLE';
  selectedRosterEmpId: any = null;
  selectedBulkEmpIds: any[] = [];
  bulkSearchQuery: string = '';
  rosterType: 'WEEKLY' | 'MONTHLY' | 'THREE_MONTHS' = 'WEEKLY';
  rosterStartDate: string = new Date().toISOString().split('T')[0];
  rosterEndDate: string = '';
  rosterShiftId: any = null;
  rosterWeekOff1: string = 'SATURDAY';
  rosterWeekOff2: string = 'SUNDAY';
  rosterIsAutoRollover: boolean = true;
  rosterRemarks: string = '';

  // Quick Edit Modal State
  isQuickEditModalOpen: boolean = false;
  quickEditEmpId: any = null;
  quickEditEmpName: string = '';
  quickEditEmpCode: string = '';
  quickEditShiftId: any = null;
  quickEditWeekOff1: string = 'SATURDAY';
  quickEditWeekOff2: string = 'SUNDAY';

  // Custom Confirm Modal State
  isConfirmModalOpen: boolean = false;
  confirmTitle: string = 'Confirm Action';
  confirmMessage: string = 'Are you sure you want to proceed?';
  confirmActionText: string = 'Confirm';
  confirmActionType: 'danger' | 'primary' = 'danger';
  private pendingConfirmCallback: (() => void) | null = null;

  // Toast State
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';
  isToastVisible: boolean = false;

  constructor(private api: ApiService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
    this.loadRecords();
    this.loadEmployees();
    this.loadHRRosterSummary();
    this.loadRosterHistory();
    this.recalculateEndDate();
  }

  showToast(msg: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = msg;
    this.toastType = type;
    this.isToastVisible = true;
    setTimeout(() => { this.isToastVisible = false; }, 4000);
  }

  setTab(tab: 'rosterList' | 'shiftMaster' | 'rosterHistory'): void {
    this.activeTab = tab;
    if (tab === 'rosterList') this.loadHRRosterSummary();
    if (tab === 'shiftMaster') this.loadRecords();
    if (tab === 'rosterHistory') this.loadRosterHistory();
  }

  initForm(): void {
    this.recordForm = this.fb.group({
      shiftCode: ['', Validators.required],
      shiftName: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      breakDurationMinutes: ['', Validators.required],
      status: ['ACTIVE', Validators.required]
    });
  }

  loadRecords(): void {
    this.api.post('/v1/shift/list', {}).subscribe((res: any) => {
      const data = Array.isArray(res?.data) ? res.data : null;
      this.items = (data && data.length > 0) ? data.filter(Boolean) : [];
      this.filterRecords();
    }, () => {
      this.items = [];
      this.filterRecords();
    });
  }

  loadEmployees(): void {
    this.api.post('/v1/employees/list', {}).subscribe((res: any) => {
      this.employees = (res && res.data && Array.isArray(res.data)) ? res.data : [];
    });
  }

  loadHRRosterSummary(): void {
    this.api.post('/v1/roster/employee-summary', {}).subscribe({
      next: (res: any) => {
        if (res && res.data && Array.isArray(res.data)) {
          this.hrRosterSummary = res.data;
          this.filterRosterSummary();
        }
      },
      error: () => {
        // Fallback summary if backend loading
        this.filterRosterSummary();
      }
    });
  }

  loadRosterHistory(): void {
    this.api.post('/v1/roster/list', {}).subscribe({
      next: (res: any) => {
        if (res && res.data && Array.isArray(res.data)) {
          this.rosterHistoryList = res.data;
        }
      }
    });
  }

  filterRosterSummary(): void {
    let list = [...(this.hrRosterSummary || [])];

    if (this.filterShiftId !== 'ALL') {
      list = list.filter(item => String(item.shiftId) === String(this.filterShiftId));
    }

    if (this.filterWeekOff !== 'ALL') {
      const target = this.filterWeekOff.toUpperCase();
      list = list.filter(item => 
        (item.weekOffDay1 && item.weekOffDay1.toUpperCase() === target) ||
        (item.weekOffDay2 && item.weekOffDay2.toUpperCase() === target)
      );
    }

    if (this.rosterSearchQuery.trim()) {
      const q = this.rosterSearchQuery.toLowerCase();
      list = list.filter(item =>
        (item.employeeCode && item.employeeCode.toLowerCase().includes(q)) ||
        (item.employeeName && item.employeeName.toLowerCase().includes(q)) ||
        (item.department && item.department.toLowerCase().includes(q)) ||
        (item.shiftName && item.shiftName.toLowerCase().includes(q)) ||
        (item.weekOffDay1 && item.weekOffDay1.toLowerCase().includes(q)) ||
        (item.weekOffDay2 && item.weekOffDay2.toLowerCase().includes(q))
      );
    }

    this.filteredRosterSummary = list;
  }

  recalculateEndDate(): void {
    if (!this.rosterStartDate) {
      this.rosterEndDate = '';
      return;
    }
    const start = new Date(this.rosterStartDate);
    if (isNaN(start.getTime())) return;

    let end = new Date(start);
    if (this.rosterType === 'WEEKLY') {
      end.setDate(end.getDate() + 6);
    } else if (this.rosterType === 'MONTHLY') {
      end.setMonth(end.getMonth() + 1);
      end.setDate(end.getDate() - 1);
    } else if (this.rosterType === 'THREE_MONTHS') {
      end.setMonth(end.getMonth() + 3);
      end.setDate(end.getDate() - 1);
    }

    this.rosterEndDate = end.toISOString().split('T')[0];
  }

  selectAllBulkEmployees(): void {
    this.selectedBulkEmpIds = (this.employees || []).map(e => e.id);
  }

  deselectAllBulkEmployees(): void {
    this.selectedBulkEmpIds = [];
  }

  toggleBulkEmpSelection(id: any): void {
    const idx = this.selectedBulkEmpIds.findIndex(eId => String(eId) === String(id));
    if (idx !== -1) {
      this.selectedBulkEmpIds.splice(idx, 1);
    } else {
      this.selectedBulkEmpIds.push(id);
    }
  }

  isBulkEmpSelected(id: any): boolean {
    return this.selectedBulkEmpIds.some(eId => String(eId) === String(id));
  }

  getFilteredBulkEmployees(): any[] {
    const list = this.employees || [];
    if (!this.bulkSearchQuery || !this.bulkSearchQuery.trim()) {
      return list;
    }
    const q = this.bulkSearchQuery.toLowerCase();
    return list.filter(e =>
      (e.employeeCode && e.employeeCode.toLowerCase().includes(q)) ||
      (e.firstName && e.firstName.toLowerCase().includes(q)) ||
      (e.lastName && e.lastName.toLowerCase().includes(q)) ||
      (e.department && e.department.departmentName && e.department.departmentName.toLowerCase().includes(q))
    );
  }

  closeAllModals(): void {
    this.isModalOpen = false;
    this.isRosterModalOpen = false;
    this.isQuickEditModalOpen = false;
    this.isConfirmModalOpen = false;
    this.pendingConfirmCallback = null;
  }

  openConfirmDialog(
    title: string,
    message: string,
    actionText: string,
    actionType: 'danger' | 'primary',
    callback: () => void
  ): void {
    this.closeAllModals();
    this.confirmTitle = title;
    this.confirmMessage = message;
    this.confirmActionText = actionText;
    this.confirmActionType = actionType;
    this.pendingConfirmCallback = callback;
    this.isConfirmModalOpen = true;
  }

  closeConfirmDialog(): void {
    this.isConfirmModalOpen = false;
    this.pendingConfirmCallback = null;
  }

  executeConfirmAction(): void {
    if (this.pendingConfirmCallback) {
      const cb = this.pendingConfirmCallback;
      this.closeConfirmDialog();
      cb();
    }
  }

  openAssignRosterModal(): void {
    this.closeAllModals();
    this.rosterAssignMode = 'SINGLE';
    this.selectedRosterEmpId = null;
    this.selectedBulkEmpIds = (this.employees || []).map(e => e.id);
    this.bulkSearchQuery = '';
    this.rosterType = 'WEEKLY';
    this.rosterStartDate = new Date().toISOString().split('T')[0];
    this.rosterShiftId = this.items.length > 0 ? this.items[0].id : null;
    this.rosterWeekOff1 = 'SATURDAY';
    this.rosterWeekOff2 = 'SUNDAY';
    this.rosterIsAutoRollover = true;
    this.rosterRemarks = '';
    this.recalculateEndDate();
    this.isRosterModalOpen = true;
  }

  openSingleRosterModal(emp: any): void {
    this.closeAllModals();
    this.openAssignRosterModal();
    this.selectedRosterEmpId = emp.employeeId;
  }

  closeRosterModal(): void {
    this.isRosterModalOpen = false;
  }

  saveRosterSchedule(): void {
    if (this.rosterAssignMode === 'SINGLE' && !this.selectedRosterEmpId) {
      this.showToast('Please select an employee.', 'error');
      return;
    }

    if (this.rosterAssignMode === 'BULK' && (!this.selectedBulkEmpIds || this.selectedBulkEmpIds.length === 0)) {
      this.showToast('Please select at least one employee for bulk roster assignment.', 'error');
      return;
    }

    const empIds = this.rosterAssignMode === 'BULK' 
      ? this.selectedBulkEmpIds
      : [this.selectedRosterEmpId];

    const payload = {
      employeeIds: empIds,
      shiftId: this.rosterShiftId,
      weekOffDay1: this.rosterWeekOff1,
      weekOffDay2: this.rosterWeekOff2,
      rosterType: this.rosterType,
      startDate: this.rosterStartDate,
      endDate: this.rosterEndDate,
      isAutoRollover: this.rosterIsAutoRollover,
      remarks: this.rosterRemarks
    };

    this.api.post('/v1/roster/create', payload).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.showToast(res.message || 'Roster schedule created successfully with Auto-Rollover rule!', 'success');
          this.closeRosterModal();
          this.loadHRRosterSummary();
          this.loadRosterHistory();
        } else {
          this.showToast(res?.message || 'Failed to create roster schedule.', 'error');
        }
      },
      error: (err: any) => {
        this.showToast(err?.error?.message || 'Error saving roster schedule.', 'error');
      }
    });
  }

  openQuickEditModal(emp: any): void {
    this.closeAllModals();
    this.quickEditEmpId = emp.employeeId;
    this.quickEditEmpName = emp.employeeName;
    this.quickEditEmpCode = emp.employeeCode;
    this.quickEditShiftId = emp.shiftId || (this.items.length > 0 ? this.items[0].id : null);
    this.quickEditWeekOff1 = emp.weekOffDay1 || 'SATURDAY';
    this.quickEditWeekOff2 = emp.weekOffDay2 || 'SUNDAY';
    this.isQuickEditModalOpen = true;
  }

  saveQuickEditConfig(): void {
    if (!this.quickEditEmpId) return;

    const payload = {
      employeeId: this.quickEditEmpId,
      shiftId: this.quickEditShiftId,
      weekOffDay1: this.quickEditWeekOff1,
      weekOffDay2: this.quickEditWeekOff2
    };

    this.api.post('/v1/employees/assign-shift-weekoff', payload).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.showToast(res.message || 'Shift and Week-Off updated successfully!', 'success');
          this.isQuickEditModalOpen = false;
          this.loadHRRosterSummary();
        } else {
          this.showToast(res?.message || 'Update failed.', 'error');
        }
      },
      error: (err: any) => {
        this.showToast(err?.error?.message || 'Failed to update configuration.', 'error');
      }
    });
  }

  deleteRosterRecord(id: any): void {
    this.openConfirmDialog(
      'Deactivate Roster Schedule',
      'Are you sure you want to deactivate this roster schedule? The employee will revert to profile defaults.',
      'Deactivate Roster',
      'danger',
      () => {
        this.api.post('/v1/roster/delete', { id }).subscribe(() => {
          this.showToast('Roster schedule deactivated.', 'success');
          this.loadRosterHistory();
          this.loadHRRosterSummary();
        });
      }
    );
  }

  filterRecords(): void {
    const list = (this.items || []).filter(Boolean);
    if (!this.searchQuery.trim()) {
      this.filteredItems = [...list];
      return;
    }
    const q = this.searchQuery.toLowerCase();
    this.filteredItems = list.filter(item =>
      item && Object.values(item).some(val => val !== null && val !== undefined && String(val).toLowerCase().includes(q))
    );
  }

  openAddModal(): void {
    this.closeAllModals();
    this.isEditMode = false;
    this.selectedId = null;
    this.recordForm.reset({ status: 'ACTIVE' });
    this.isModalOpen = true;
  }

  openEditModal(item: any): void {
    this.closeAllModals();
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
    const endpoint = this.isEditMode ? '/v1/shift/update' : '/v1/shift/create';
    this.api.post(endpoint, payload).subscribe(() => {
      this.showToast(`Shift ${this.isEditMode ? 'updated' : 'created'} successfully!`, 'success');
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
      this.showToast(`Shift ${this.isEditMode ? 'updated' : 'created'}!`, 'success');
    });
  }

  deleteRecord(item: any): void {
    this.openConfirmDialog(
      'Delete Shift Record',
      `Are you sure you want to delete shift "${item.shiftName}" (${item.shiftCode})?`,
      'Delete Shift',
      'danger',
      () => {
        this.api.post('/v1/shift/delete', { id: item.id }).subscribe(() => {
          this.showToast('Shift deleted successfully.', 'success');
          this.loadRecords();
        }, () => {
          this.items = this.items.filter(i => i.id !== item.id);
          this.filterRecords();
          this.showToast('Shift deleted.', 'success');
        });
      }
    );
  }

  getBadgeClass(status: string): string {
    const s = String(status || '').toUpperCase();
    if (s.includes('ACTIVE') || s.includes('APPROVED')) return 'badge badge-active';
    if (s.includes('PENDING')) return 'badge badge-pending';
    if (s.includes('REJECTED') || s.includes('CANCEL')) return 'badge badge-rejected';
    return 'badge badge-inactive';
  }

  getRosterTypeClass(type: string): string {
    const t = String(type || '').toUpperCase();
    if (t.includes('WEEKLY')) return 'roster-pill roster-weekly';
    if (t.includes('THREE') || t.includes('QUARTERLY')) return 'roster-pill roster-quarterly';
    if (t.includes('MONTHLY')) return 'roster-pill roster-monthly';
    return 'roster-pill roster-default';
  }

  formatRosterType(type: string): string {
    const t = String(type || '').toUpperCase();
    if (t.includes('THREE')) return '📅 3 Months Roster';
    if (t.includes('MONTHLY')) return '📅 1 Month Roster';
    if (t.includes('WEEKLY')) return '📅 1 Week Roster';
    return '👤 Profile Default';
  }

  getInitials(name: string): string {
    if (!name) return 'E';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }
}
