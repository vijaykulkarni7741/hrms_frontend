import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <!-- Toast Notification Banner -->
    <div class="toast-container" *ngIf="isToastVisible" [class]="'toast-' + toastType">
      <div class="toast-content">
        <span class="toast-icon" *ngIf="toastType === 'success'">✓</span>
        <span class="toast-icon" *ngIf="toastType === 'error'">✖</span>
        <span class="toast-icon" *ngIf="toastType === 'warning'">⚠️</span>
        <span class="toast-text">{{ toastMessage }}</span>
      </div>
      <button class="toast-close" (click)="closeToast()">&times;</button>
    </div>

    <div class="glass-card">
      <div class="header-actions">
        <div class="title-group">
          <h2>Attendance Records</h2>
          <p>Employee check-in, check-out, and attendance history tracking</p>
        </div>
        <div class="export-actions">
          <button class="btn-primary btn-sm" (click)="exportExcel()">📊 Export Excel</button>
          <button class="btn-secondary btn-sm ms-2" (click)="exportPdf()">📄 Export PDF</button>
          <button class="btn-secondary btn-sm ms-2" (click)="openShiftConfigModal()">⚙️ Shift & Week-Off Config</button>
        </div>
      </div>

      <!-- Filter Controls Bar -->
      <div class="filter-bar mb-3">
        <div class="filter-group">
          <label class="filter-label">Filter Mode:</label>
          <select class="form-control select-control" [(ngModel)]="filterMode" (change)="onFilterModeChange()">
            <option value="CURRENT_MONTH">Current Month</option>
            <option value="LAST_MONTH">Last Month</option>
            <option value="CUSTOM_DATE">Custom Date Range</option>
            <option value="SELECT_MONTH">Select Month & Year</option>
          </select>
        </div>

        <ng-container *ngIf="filterMode === 'SELECT_MONTH'">
          <div class="filter-group">
            <label class="filter-label">Month:</label>
            <select class="form-control select-control" [(ngModel)]="selectedMonth" (change)="loadRecords()">
              <option *ngFor="let m of monthOptions" [value]="m.value">{{ m.label }}</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Year:</label>
            <select class="form-control select-control" [(ngModel)]="selectedYear" (change)="loadRecords()">
              <option [value]="2026">2026</option>
              <option [value]="2025">2025</option>
            </select>
          </div>
        </ng-container>

        <ng-container *ngIf="filterMode === 'CUSTOM_DATE'">
          <div class="filter-group">
            <label class="filter-label">From Date:</label>
            <input type="date" class="form-control date-control" [(ngModel)]="fromDate" (change)="loadRecords()" />
          </div>
          <div class="filter-group">
            <label class="filter-label">To Date:</label>
            <input type="date" class="form-control date-control" [(ngModel)]="toDate" (change)="loadRecords()" />
          </div>
        </ng-container>

        <button class="btn-secondary" (click)="loadRecords()">🔍 Search Records</button>
        <button class="btn-secondary" (click)="resetFilter()">🔄 Reset Filter</button>
      </div>

      <div class="search-box">
        <input
          type="text"
          class="search-input"
          placeholder="Filter by keyword (name, code, status)..."
          [(ngModel)]="searchQuery"
          (input)="filterRecords()"
        />
      </div>

      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Employee Code</th>
              <th>Employee Name</th>
              <th>Date</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Hours</th>
              <th>Status</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of filteredItems" [class.row-absent]="item.status === 'ABSENT'">
              <td>{{ item.employee?.employeeCode || item.employeeCode || '-' }}</td>
              <td>{{ getEmployeeFullName(item) }}</td>
              <td>{{ item.attendanceDate }}</td>
              <td>{{ item.inTime || item.checkInTime || '-' }}</td>
              <td>{{ item.outTime || item.checkOutTime || '-' }}</td>
              <td>{{ item.totalHours ? item.totalHours + ' hrs' : (item.workingHours || '-') }}</td>
              <td>
                <span [class]="getBadgeClass(item.status || item.attendanceStatus)">
                  {{ item.status || item.attendanceStatus || 'PRESENT' }}
                </span>
              </td>
              <td style="text-align: right;">
                <!-- Apply Comp-Off button when worked on week-off -->
                <button *ngIf="item.status === 'WEEK_OFF_WORKED' || item.status === 'WEEK_OFF_PRESENT'"
                        class="btn-primary btn-sm"
                        (click)="openCompOffModal(item)">
                  🎁 Apply Comp-Off
                </button>

                <!-- Apply Leave button when absent -->
                <button *ngIf="item.status === 'ABSENT'"
                        class="btn-secondary btn-sm"
                        (click)="openAbsentLeaveModal(item)">
                  📄 Apply Leave
                </button>

                <span *ngIf="item.status === 'COMP_OFF_REQUESTED' || item.status === 'COMP_OFF_USED'" class="badge badge-purple">✓ Comp-Off Used</span>
                <span *ngIf="item.status === 'LEAVE REQUESTED'" class="badge badge-pending">✓ Leave Requested</span>
                <span *ngIf="item.status === 'LEAVE'" class="badge badge-approved">✓ On Leave</span>

                <span *ngIf="item.status !== 'WEEK_OFF_WORKED' && item.status !== 'WEEK_OFF_PRESENT' && item.status !== 'ABSENT' && item.status !== 'COMP_OFF_REQUESTED' && item.status !== 'COMP_OFF_USED' && item.status !== 'LEAVE REQUESTED' && item.status !== 'LEAVE'" class="text-muted">-</span>
              </td>
            </tr>
            <tr *ngIf="filteredItems.length === 0">
              <td colspan="8" class="empty-state">
                No attendance records found for selected filter criteria.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Comp-Off Application Modal -->
    <div class="modal-backdrop" *ngIf="isCompOffModalOpen" (click)="closeCompOffModal()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>🎁 Apply Compensatory Off (Comp-Off) Leave</h3>
          <button class="close-btn" (click)="closeCompOffModal()">&times;</button>
        </div>
        <div class="comp-off-body" *ngIf="compOffItem">
          <p class="modal-subtitle">
            You worked on your scheduled week-off date: <strong>{{ compOffItem.attendanceDate }}</strong>.
          </p>

          <div class="form-group mt-3">
            <label>Select Target Future Leave Date</label>
            <input type="date" class="form-control" [(ngModel)]="compOffTargetDate" />
          </div>

          <div class="form-group mt-3">
            <label>Reason for Comp-Off Request</label>
            <textarea class="form-control" rows="3" [(ngModel)]="compOffReason" placeholder="e.g. Taking Comp-Off leave for working on week-off date"></textarea>
          </div>

          <div class="modal-footer mt-4">
            <button type="button" class="btn-secondary" (click)="closeCompOffModal()">Cancel</button>
            <button type="button" class="btn-primary" [disabled]="isSubmittingCompOff" (click)="submitCompOff()">
              Submit Comp-Off Leave Request
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Absent Leave Application Modal -->
    <div class="modal-backdrop" *ngIf="isAbsentLeaveModalOpen" (click)="closeAbsentLeaveModal()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>📄 Apply Leave for Absent Date</h3>
          <button class="close-btn" (click)="closeAbsentLeaveModal()">&times;</button>
        </div>
        <div class="absent-leave-body" *ngIf="absentItem">
          <p class="modal-subtitle">
            Submit a leave application for absent date: <strong>{{ absentItem.attendanceDate }}</strong>.
          </p>

          <!-- Leave Balances Chips -->
          <div class="balances-container mt-2 mb-3">
            <span class="balance-title">Employee Available Leave Balances:</span>
            <div class="chips-row mt-1">
              <div class="chip chip-cl">Casual Leave (CL): <strong>{{ getRemainingBalance('Casual Leave', 12) }} days</strong></div>
              <div class="chip chip-sl">Sick Leave (SL): <strong>{{ getRemainingBalance('Sick Leave', 6) }} days</strong></div>
              <div class="chip chip-pl">Paid Leave (PL): <strong>{{ getRemainingBalance('Paid Leave', 15) }} days</strong></div>
              <div class="chip chip-compoff">Comp-Off Available: <strong>{{ unconsumedWeekOffs.length }} days</strong></div>
            </div>
          </div>

          <div class="form-group mt-3">
            <label>Select Leave Type</label>
            <select class="form-control" [(ngModel)]="selectedLeaveType">
              <option value="Casual Leave">Casual Leave (CL)</option>
              <option value="Sick Leave">Sick Leave (SL)</option>
              <option value="Paid Leave">Paid Leave (PL)</option>
              <option value="Comp-Off">Comp-Off (Compensatory Off)</option>
            </select>
          </div>

          <div class="form-group mt-3" *ngIf="selectedLeaveType === 'Comp-Off'">
            <label>Select Extra Worked Week-Off Date</label>
            <select class="form-control" [(ngModel)]="selectedWeekOffDate" *ngIf="unconsumedWeekOffs.length > 0">
              <option *ngFor="let w of unconsumedWeekOffs" [value]="w.attendanceDate">
                {{ w.attendanceDate }} (Worked on Week-Off)
              </option>
            </select>
            <div class="text-warning-custom mt-1" *ngIf="unconsumedWeekOffs.length === 0">
              ⚠️ No unconsumed week-off worked dates available for Comp-Off.
            </div>
          </div>

          <div class="form-group mt-3">
            <label>Leave Reason / Notes</label>
            <textarea class="form-control" rows="3" [(ngModel)]="absentLeaveReason" placeholder="e.g. Sick leave / personal work / comp-off on this date"></textarea>
          </div>

          <div class="modal-footer mt-4">
            <button type="button" class="btn-secondary" (click)="closeAbsentLeaveModal()">Cancel</button>
            <button type="button" class="btn-primary" [disabled]="isSubmittingAbsentLeave" (click)="submitAbsentLeave()">
              Submit Leave Application
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Shift & Week-Off Config Modal -->
    <div class="modal-backdrop" *ngIf="isShiftConfigModalOpen" (click)="closeShiftConfigModal()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>⚙️ Configure Employee Shift & Week-Offs</h3>
          <button class="close-btn" (click)="closeShiftConfigModal()">&times;</button>
        </div>
        <div class="shift-config-body">
          <div class="form-group mt-2">
            <label>Select Employee</label>
            <select class="form-control" [(ngModel)]="shiftConfigEmpId" (change)="onShiftConfigEmpSelect()">
              <option [value]="null">-- Select Employee --</option>
              <option *ngFor="let emp of employeesList" [value]="emp.id">
                {{ emp.employeeCode }} - {{ emp.firstName }} {{ emp.lastName }}
              </option>
            </select>
          </div>

          <div class="form-group mt-3">
            <label>Assigned Work Shift</label>
            <select class="form-control" [(ngModel)]="shiftConfigShiftId">
              <option [value]="null">-- Select Shift --</option>
              <option *ngFor="let s of shiftsList" [value]="s.id">
                {{ s.shiftName }} ({{ s.startTime }} - {{ s.endTime }})
              </option>
            </select>
          </div>

          <div class="form-group mt-3">
            <label>First Week-Off Day</label>
            <select class="form-control" [(ngModel)]="shiftConfigWeekOff1">
              <option value="SUNDAY">Sunday</option>
              <option value="SATURDAY">Saturday</option>
              <option value="MONDAY">Monday</option>
              <option value="TUESDAY">Tuesday</option>
              <option value="WEDNESDAY">Wednesday</option>
              <option value="THURSDAY">Thursday</option>
              <option value="FRIDAY">Friday</option>
            </select>
          </div>

          <div class="form-group mt-3">
            <label>Second Week-Off Day</label>
            <select class="form-control" [(ngModel)]="shiftConfigWeekOff2">
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

          <div class="modal-footer mt-4">
            <button type="button" class="btn-secondary" (click)="closeShiftConfigModal()">Cancel</button>
            <button type="button" class="btn-primary" [disabled]="!shiftConfigEmpId" (click)="saveShiftConfig()">
              Save Shift & Week-Offs
            </button>
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
    color: #f8fafc;
  }

  /* Toast Notification Styling */
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
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    font-size: 0.875rem;
    font-weight: 500;
    max-width: 440px;
    animation: slideInRight 0.3s ease-out;
  }
  .toast-success {
    background: rgba(20, 83, 45, 0.92);
    border: 1px solid rgba(34, 197, 94, 0.5);
    color: #f0fdf4;
  }
  .toast-error {
    background: rgba(127, 29, 29, 0.92);
    border: 1px solid rgba(239, 68, 68, 0.5);
    color: #fef2f2;
  }
  .toast-warning {
    background: rgba(113, 63, 18, 0.92);
    border: 1px solid rgba(234, 179, 8, 0.5);
    color: #fefce8;
  }
  .toast-content {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .toast-icon {
    font-size: 1.1rem;
    font-weight: bold;
  }
  .toast-close {
    background: none;
    border: none;
    color: currentColor;
    font-size: 1.25rem;
    cursor: pointer;
    opacity: 0.8;
  }
  .toast-close:hover {
    opacity: 1;
  }
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
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
  .export-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .filter-bar {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    background: rgba(15, 23, 42, 0.4);
    padding: 0.85rem 1rem;
    border-radius: 10px;
    border: 1px solid rgba(137, 30, 162, 0.2);
  }
  .filter-group {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .filter-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #cbd5e1;
    white-space: nowrap;
  }
  .select-control {
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(137, 30, 162, 0.3);
    border-radius: 6px;
    padding: 0.4rem 0.65rem;
    color: #ffffff;
    font-size: 0.85rem;
  }
  .date-control {
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(137, 30, 162, 0.3);
    border-radius: 6px;
    padding: 0.4rem 0.65rem;
    color: #ffffff;
    font-size: 0.85rem;
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
  .btn-sm {
    padding: 0.35rem 0.75rem;
    font-size: 0.8rem;
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
  .ms-2 { margin-left: 0.5rem; }
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
    max-width: 360px;
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
  .row-absent {
    background: rgba(239, 68, 68, 0.08);
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
  .badge-warning { background: rgba(234, 179, 8, 0.2); color: #fde047; border: 1px solid rgba(234, 179, 8, 0.3); }
  .badge-pending { background: rgba(234, 179, 8, 0.2); color: #fde047; border: 1px solid rgba(234, 179, 8, 0.3); }
  .badge-approved { background: rgba(59, 130, 246, 0.2); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.3); }
  .badge-rejected { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.3); }
  .badge-purple { background: rgba(168, 85, 247, 0.2); color: #d8b4fe; border: 1px solid rgba(168, 85, 247, 0.3); }

  .balances-container {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(137, 30, 162, 0.25);
    border-radius: 8px;
    padding: 0.75rem;
  }
  .balance-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: #cbd5e1;
  }
  .chips-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .chip {
    font-size: 0.75rem;
    padding: 0.3rem 0.6rem;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .chip-cl { border-color: rgba(59, 130, 246, 0.4); color: #93c5fd; }
  .chip-sl { border-color: rgba(234, 179, 8, 0.4); color: #fde047; }
  .chip-pl { border-color: rgba(34, 197, 94, 0.4); color: #86efac; }
  .chip-compoff { border-color: rgba(168, 85, 247, 0.4); color: #d8b4fe; }

  .text-warning-custom { color: #fde047; font-size: 0.8rem; }
  .text-muted { color: #94a3b8; font-size: 0.8rem; }
  .mb-3 { margin-bottom: 1rem; }
  .mt-1 { margin-top: 0.25rem; }
  .mt-2 { margin-top: 0.5rem; }
  .mt-3 { margin-top: 0.85rem; }
  .mt-4 { margin-top: 1.5rem; }

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
    max-width: 540px;
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
    font-size: 1.15rem;
    color: #ffffff;
  }
  .modal-subtitle {
    font-size: 0.875rem;
    color: #cbd5e1;
    margin: 0 0 1rem 0;
  }
  .close-btn {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 1.25rem;
    cursor: pointer;
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
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }
  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #94a3b8;
  }
  `]
})
export class AttendanceListComponent implements OnInit {
  items: any[] = [];
  filteredItems: any[] = [];
  searchQuery: string = '';

  // Toast Notification state
  toastMessage: string = '';
  toastType: 'success' | 'error' | 'warning' = 'success';
  isToastVisible: boolean = false;
  toastTimeout: any = null;

  // Filter State
  filterMode: string = 'CURRENT_MONTH'; // CURRENT_MONTH, LAST_MONTH, CUSTOM_DATE, SELECT_MONTH
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  fromDate: string = '';
  toDate: string = '';

  monthOptions = [
    { label: 'January', value: 1 }, { label: 'February', value: 2 },
    { label: 'March', value: 3 },   { label: 'April', value: 4 },
    { label: 'May', value: 5 },     { label: 'June', value: 6 },
    { label: 'July', value: 7 },    { label: 'August', value: 8 },
    { label: 'September', value: 9 }, { label: 'October', value: 10 },
    { label: 'November', value: 11 }, { label: 'December', value: 12 }
  ];

  // Comp-Off Modal state
  isCompOffModalOpen: boolean = false;
  isSubmittingCompOff: boolean = false;
  compOffItem: any = null;
  compOffTargetDate: string = '';
  compOffReason: string = '';

  // Absent Leave Modal state
  isAbsentLeaveModalOpen: boolean = false;
  isSubmittingAbsentLeave: boolean = false;
  absentItem: any = null;
  absentLeaveReason: string = '';
  
  // Leave Balances & Unconsumed Comp-Offs
  myBalances: any[] = [];
  unconsumedWeekOffs: any[] = [];
  selectedLeaveType: string = 'Casual Leave';
  selectedWeekOffDate: string = '';

  // Shift Config Modal state
  isShiftConfigModalOpen: boolean = false;
  employeesList: any[] = [];
  shiftsList: any[] = [];
  shiftConfigEmpId: any = null;
  shiftConfigShiftId: any = null;
  shiftConfigWeekOff1: string = 'SATURDAY';
  shiftConfigWeekOff2: string = 'SUNDAY';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.initDefaultDates();
    this.loadRecords();
  }

  showToast(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.isToastVisible = true;
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => {
      this.isToastVisible = false;
    }, 4500);
  }

  closeToast(): void {
    this.isToastVisible = false;
  }

  formatErrorMessage(errResponse: any, fallbackMessage: string): string {
    let msg = errResponse?.error?.message || errResponse?.message || fallbackMessage;
    if (msg.includes('Internal server error') || msg.includes('could not execute statement') || msg.includes('violates not-null constraint')) {
      return 'Leave application failed. Please select a valid leave type or contact HR.';
    }
    return msg;
  }

  initDefaultDates(): void {
    const today = new Date();
    this.toDate = today.toISOString().split('T')[0];
    
    const past = new Date();
    past.setDate(today.getDate() - 30);
    this.fromDate = past.toISOString().split('T')[0];
  }

  onFilterModeChange(): void {
    if (this.filterMode === 'LAST_MONTH') {
      const now = new Date();
      let m = now.getMonth(); // 0-indexed past month
      let y = now.getFullYear();
      if (m === 0) {
        m = 12;
        y = y - 1;
      }
      this.selectedMonth = m;
      this.selectedYear = y;
    } else if (this.filterMode === 'CURRENT_MONTH') {
      const now = new Date();
      this.selectedMonth = now.getMonth() + 1;
      this.selectedYear = now.getFullYear();
    }
    this.loadRecords();
  }

  resetFilter(): void {
    const now = new Date();
    this.filterMode = 'CURRENT_MONTH';
    this.selectedMonth = now.getMonth() + 1;
    this.selectedYear = now.getFullYear();
    this.searchQuery = '';
    this.fromDate = '';
    this.toDate = '';
    this.loadRecords();
    this.showToast('Attendance filters reset to Current Month.', 'success');
  }

  loadRecords(): void {
    let queryParams = '';

    if (this.filterMode === 'CUSTOM_DATE' && this.fromDate && this.toDate) {
      queryParams = `?fromDate=${this.fromDate}&toDate=${this.toDate}`;
    } else if (this.filterMode === 'LAST_MONTH' || this.filterMode === 'SELECT_MONTH' || this.filterMode === 'CURRENT_MONTH') {
      queryParams = `?month=${this.selectedMonth}&year=${this.selectedYear}`;
    }

    this.api.post(`/v1/attendance/my-logs${queryParams}`, {}).subscribe((res: any) => {
      this.items = (res && res.data && Array.isArray(res.data)) ? res.data : [];
      this.filterRecords();
    }, () => {
      this.api.post(`/v1/attendance/list${queryParams}`, {}).subscribe((res: any) => {
        this.items = (res && res.data && Array.isArray(res.data)) ? res.data : [];
        this.filterRecords();
      }, () => {
        this.items = [];
        this.filterRecords();
      });
    });
  }

  filterRecords(): void {
    if (!this.searchQuery.trim()) {
      this.filteredItems = [...this.items];
      return;
    }
    const q = this.searchQuery.toLowerCase();
    this.filteredItems = this.items.filter(item => {
      const code = item.employee?.employeeCode || item.employeeCode || '';
      const name = this.getEmployeeFullName(item);
      const date = item.attendanceDate || '';
      const status = item.status || item.attendanceStatus || '';
      return code.toLowerCase().includes(q) || name.toLowerCase().includes(q) || date.toLowerCase().includes(q) || status.toLowerCase().includes(q);
    });
  }

  getEmployeeFullName(item: any): string {
    if (item.employee) {
      return `${item.employee.firstName || ''} ${item.employee.lastName || ''}`.trim() || item.employee.employeeCode || '-';
    }
    return item.employeeName || '-';
  }

  exportExcel(): void {
    if (!this.filteredItems || this.filteredItems.length === 0) {
      this.showToast('No attendance records available to export.', 'warning');
      return;
    }
    const headers = ['Employee Code', 'Employee Name', 'Date', 'Check In', 'Check Out', 'Hours', 'Status', 'Remarks'];
    const rows = this.filteredItems.map(item => [
      `"${item.employee?.employeeCode || item.employeeCode || '-'}"`,
      `"${this.getEmployeeFullName(item)}"`,
      `"${item.attendanceDate || '-'}"`,
      `"${item.inTime || item.checkInTime || '-'}"`,
      `"${item.outTime || item.checkOutTime || '-'}"`,
      `"${item.totalHours ? item.totalHours + ' hrs' : (item.workingHours || '-')}"`,
      `"${item.status || item.attendanceStatus || 'PRESENT'}"`,
      `"${(item.remarks || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_Records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast('Attendance records exported to Excel successfully!', 'success');
  }

  exportPdf(): void {
    if (!this.filteredItems || this.filteredItems.length === 0) {
      this.showToast('No attendance records available to print/export.', 'warning');
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const rowsHtml = this.filteredItems.map(item => `
      <tr>
        <td>${item.employee?.employeeCode || item.employeeCode || '-'}</td>
        <td>${this.getEmployeeFullName(item)}</td>
        <td>${item.attendanceDate || '-'}</td>
        <td>${item.inTime || item.checkInTime || '-'}</td>
        <td>${item.outTime || item.checkOutTime || '-'}</td>
        <td>${item.totalHours ? item.totalHours + ' hrs' : (item.workingHours || '-')}</td>
        <td>${item.status || item.attendanceStatus || 'PRESENT'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Attendance Records Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h2 { color: #891EA2; margin-bottom: 5px; }
            p { color: #666; font-size: 14px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 13px; }
            th { background-color: #f3e8ff; color: #891EA2; }
            tr:nth-child(even) { background-color: #f9fafb; }
          </style>
        </head>
        <body>
          <h2>Attendance Records Report</h2>
          <p>Generated on ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Employee Code</th>
                <th>Employee Name</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
    this.showToast('Preparing PDF print report...', 'success');
  }

  // Open Shift Config Modal
  openShiftConfigModal(): void {
    this.isShiftConfigModalOpen = true;
    this.api.post('/v1/employees/list', {}).subscribe((res: any) => {
      this.employeesList = (res && res.data && Array.isArray(res.data)) ? res.data : [];
    });
    this.api.post('/v1/shift/list', {}).subscribe((res: any) => {
      this.shiftsList = (res && res.data && Array.isArray(res.data)) ? res.data : [
        { id: 1, shiftName: 'General Day Shift', startTime: '09:00 AM', endTime: '06:00 PM' },
        { id: 2, shiftName: 'Morning Shift', startTime: '07:00 AM', endTime: '04:00 PM' }
      ];
    });
  }

  closeShiftConfigModal(): void {
    this.isShiftConfigModalOpen = false;
  }

  onShiftConfigEmpSelect(): void {
    if (!this.shiftConfigEmpId) return;
    const emp = this.employeesList.find(e => String(e.id) === String(this.shiftConfigEmpId));
    if (emp) {
      this.shiftConfigShiftId = emp.shiftId || (this.shiftsList.length > 0 ? this.shiftsList[0].id : null);
      this.shiftConfigWeekOff1 = emp.weekOffDay1 || 'SATURDAY';
      this.shiftConfigWeekOff2 = emp.weekOffDay2 || 'SUNDAY';
    }
  }

  saveShiftConfig(): void {
    if (!this.shiftConfigEmpId) return;
    const payload = {
      employeeId: this.shiftConfigEmpId,
      shiftId: this.shiftConfigShiftId,
      weekOffDay1: this.shiftConfigWeekOff1,
      weekOffDay2: this.shiftConfigWeekOff2
    };

    this.api.post('/v1/employees/assign-shift-weekoff', payload).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.showToast(res.message || 'Shift and Week-Offs updated successfully!', 'success');
          this.closeShiftConfigModal();
          this.loadRecords();
        } else {
          this.showToast(res?.message || 'Failed to update shift configuration.', 'error');
        }
      },
      error: (err: any) => {
        this.showToast(err?.error?.message || 'Failed to save shift configuration.', 'error');
      }
    });
  }

  // Open Comp-Off Modal
  openCompOffModal(item: any): void {
    this.compOffItem = item;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.compOffTargetDate = tomorrow.toISOString().split('T')[0];
    this.compOffReason = '';
    this.isCompOffModalOpen = true;
  }

  closeCompOffModal(): void {
    this.isCompOffModalOpen = false;
    this.compOffItem = null;
  }

  submitCompOff(): void {
    if (!this.compOffItem) return;
    this.isSubmittingCompOff = true;

    const payload = {
      attendanceDate: this.compOffItem.attendanceDate,
      targetLeaveDate: this.compOffTargetDate,
      reason: this.compOffReason
    };

    this.api.post('/v1/attendance/apply-comp-off', payload).subscribe({
      next: (res: any) => {
        this.isSubmittingCompOff = false;
        if (res && res.success) {
          this.showToast(`Comp-Off leave application submitted successfully for ${this.compOffTargetDate}!`, 'success');
          this.closeCompOffModal();
          this.loadRecords();
        } else {
          this.showToast(this.formatErrorMessage(res, 'Comp-Off application failed.'), 'error');
        }
      },
      error: (err: any) => {
        this.isSubmittingCompOff = false;
        this.showToast(this.formatErrorMessage(err, 'Failed to submit Comp-Off request.'), 'error');
      }
    });
  }

  // Open Absent Leave Modal
  openAbsentLeaveModal(item: any): void {
    this.absentItem = item;
    this.absentLeaveReason = '';
    this.selectedLeaveType = 'Casual Leave';
    this.selectedWeekOffDate = '';
    this.isAbsentLeaveModalOpen = true;

    // Fetch employee leave balances
    this.api.post('/v1/leave-balances/my-balances', {}).subscribe({
      next: (res: any) => {
        this.myBalances = (res && res.success && Array.isArray(res.data)) ? res.data : [];
      },
      error: () => {
        this.myBalances = [];
      }
    });

    // Fetch unconsumed week-offs
    this.api.post('/v1/attendance/unconsumed-weekoffs', {}).subscribe({
      next: (res: any) => {
        this.unconsumedWeekOffs = (res && res.success && Array.isArray(res.data)) ? res.data : [];
        if (this.unconsumedWeekOffs.length > 0) {
          this.selectedWeekOffDate = this.unconsumedWeekOffs[0].attendanceDate;
        }
      },
      error: () => {
        this.unconsumedWeekOffs = [];
      }
    });
  }

  getRemainingBalance(leaveTypeName: string, defaultDays: number): number {
    if (!this.myBalances || this.myBalances.length === 0) return defaultDays;
    const match = this.myBalances.find(b => {
      const typeStr = b.leaveType?.typeName || b.leaveType?.typeCode || '';
      return typeStr.toLowerCase().includes(leaveTypeName.toLowerCase());
    });
    if (match && match.remainingDays != null) {
      return match.remainingDays;
    }
    return defaultDays;
  }

  closeAbsentLeaveModal(): void {
    this.isAbsentLeaveModalOpen = false;
    this.absentItem = null;
  }

  submitAbsentLeave(): void {
    if (!this.absentItem) return;
    this.isSubmittingAbsentLeave = true;

    if (this.selectedLeaveType === 'Comp-Off') {
      if (!this.selectedWeekOffDate) {
        this.showToast('Please select a valid Extra Work Day (Week-Off date) to apply for Comp-Off.', 'warning');
        this.isSubmittingAbsentLeave = false;
        return;
      }

      const payload = {
        attendanceDate: this.selectedWeekOffDate,
        targetLeaveDate: this.absentItem.attendanceDate,
        reason: this.absentLeaveReason || 'Comp-Off requested for absent date'
      };

      this.api.post('/v1/attendance/apply-comp-off', payload).subscribe({
        next: (res: any) => {
          this.isSubmittingAbsentLeave = false;
          if (res && res.success) {
            this.showToast(`Comp-Off leave application submitted successfully for absent date ${this.absentItem.attendanceDate}!`, 'success');
            this.closeAbsentLeaveModal();
            this.loadRecords();
          } else {
            this.showToast(this.formatErrorMessage(res, 'Comp-Off application failed.'), 'error');
          }
        },
        error: (err: any) => {
          this.isSubmittingAbsentLeave = false;
          this.showToast(this.formatErrorMessage(err, 'Failed to submit Comp-Off request.'), 'error');
        }
      });
    } else {
      const payload = {
        employee: { id: this.absentItem.employee?.id || null },
        startDate: this.absentItem.attendanceDate,
        endDate: this.absentItem.attendanceDate,
        totalDays: 1,
        reason: `[${this.selectedLeaveType}] ` + (this.absentLeaveReason || 'Leave requested for absent date')
      };

      this.api.post('/v1/leave-applications/create', payload).subscribe({
        next: (res: any) => {
          this.isSubmittingAbsentLeave = false;
          if (res && res.success) {
            this.showToast(`Leave application (${this.selectedLeaveType}) submitted successfully for absent date!`, 'success');
            this.closeAbsentLeaveModal();
            this.loadRecords();
          } else {
            this.showToast(this.formatErrorMessage(res, 'Leave application failed.'), 'error');
          }
        },
        error: (err: any) => {
          this.isSubmittingAbsentLeave = false;
          this.showToast(this.formatErrorMessage(err, 'Failed to submit leave application.'), 'error');
        }
      });
    }
  }

  getBadgeClass(status: string): string {
    const s = String(status || '').toUpperCase();
    if (s === 'PRESENT' || s === 'APPROVED' || s === 'ACTIVE') return 'badge badge-active';
    if (s === 'LATE' || s.includes('MISSED')) return 'badge badge-warning';
    if (s === 'LEAVE REQUESTED' || s === 'PENDING') return 'badge badge-pending';
    if (s === 'LEAVE') return 'badge badge-approved';
    if (s === 'ABSENT' || s === 'REJECTED') return 'badge badge-rejected';
    if (s === 'WEEK_OFF') return 'badge badge-inactive';
    if (s === 'WEEK_OFF_WORKED' || s === 'WEEK_OFF_PRESENT' || s === 'COMP_OFF_REQUESTED' || s === 'COMP_OFF_USED') return 'badge badge-purple';
    return 'badge badge-inactive';
  }
}
