import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, ApiResponse } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

export interface HrmsRuleConfigData {
  id?: number;
  plannedLeaveAdvanceDays: number;
  regularizationMaxDays: number;
  maxRegularizationsPerMonth: number;
  maxLeaveApplicationsPerMonth: number;
  allowSameDayRegularization: boolean;
  allowFutureDateRegularization: boolean;
  standardInTime: string;
  standardOutTime: string;
  isActive?: boolean;
  updatedBy?: string;
  updatedDate?: string;
}

@Component({
  selector: 'app-hr-rule-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="rule-config-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">⚙️ Dynamic HR Attendance & Leave Policy Rules</h1>
          <p class="page-subtitle">Configure company-wide dynamic rule limits for attendance regularizations, leave applications, and shift controls</p>
        </div>
        <button class="btn btn-outline" (click)="loadRules()">🔄 Reload Rules</button>
      </div>

      <!-- Main Form Card -->
      <div class="card main-card">
        <div class="card-header">
          <h2 class="card-title">Attendance & Leave Dynamic Rule Controls</h2>
          <span class="badge badge-success" *ngIf="config.updatedBy">Active System Policy</span>
        </div>

        <div class="rules-grid">
          <!-- Rule 1: Monthly Attendance Regularization Request Limit (Key Requirement) -->
          <div class="rule-card highlight-card">
            <div class="rule-icon">🎯</div>
            <div class="rule-body">
              <h3 class="rule-name">Monthly Attendance Regularization Limit</h3>
              <p class="rule-desc">Maximum number of attendance regularization requests an employee can raise per calendar month.</p>
              
              <div class="input-group-row mt-3">
                <input type="number" 
                       class="form-control number-input" 
                       [(ngModel)]="config.maxRegularizationsPerMonth" 
                       min="0" 
                       max="30" />
                <span class="unit-label">Requests / Month</span>
              </div>
              <p class="rule-hint">Current Setting: Maximum <strong>{{ config.maxRegularizationsPerMonth || 3 }} regularization request(s)</strong> per employee each month.</p>
            </div>
          </div>

          <!-- Rule 2: Missed Punch Regularization Window -->
          <div class="rule-card">
            <div class="rule-icon">⏱️</div>
            <div class="rule-body">
              <h3 class="rule-name">Attendance Regularization Window</h3>
              <p class="rule-desc">Maximum timeframe (days back) after a missed check-in/check-out for raising a regularization request.</p>
              
              <div class="input-group-row mt-3">
                <input type="number" 
                       class="form-control number-input" 
                       [(ngModel)]="config.regularizationMaxDays" 
                       min="1" 
                       max="30" />
                <span class="unit-label">Days Back Allowed</span>
              </div>
              <p class="rule-hint">Current Setting: Regularization allowed only within <strong>{{ config.regularizationMaxDays }} days</strong> of attendance date.</p>
            </div>
          </div>

          <!-- Rule 3: Monthly Leave Applications Limit -->
          <div class="rule-card">
            <div class="rule-icon">🏖️</div>
            <div class="rule-body">
              <h3 class="rule-name">Monthly Leave Application Limit</h3>
              <p class="rule-desc">Maximum number of leave applications an employee can submit per calendar month.</p>
              
              <div class="input-group-row mt-3">
                <input type="number" 
                       class="form-control number-input" 
                       [(ngModel)]="config.maxLeaveApplicationsPerMonth" 
                       min="0" 
                       max="60" />
                <span class="unit-label">Applications / Month</span>
              </div>
              <p class="rule-hint">Current Setting: Maximum <strong>{{ config.maxLeaveApplicationsPerMonth || 10 }} leave application(s)</strong> per month.</p>
            </div>
          </div>

          <!-- Rule 4: Planned Leave Advance Days -->
          <div class="rule-card">
            <div class="rule-icon">🌴</div>
            <div class="rule-body">
              <h3 class="rule-name">Planned Leave Advance Notice</h3>
              <p class="rule-desc">Minimum days in advance required to request Planned / Earned Leave before leave start date.</p>
              
              <div class="input-group-row mt-3">
                <input type="number" 
                       class="form-control number-input" 
                       [(ngModel)]="config.plannedLeaveAdvanceDays" 
                       min="0" 
                       max="60" />
                <span class="unit-label">Days in Advance</span>
              </div>
              <p class="rule-hint">Current Setting: Requests submitted less than <strong>{{ config.plannedLeaveAdvanceDays }} days</strong> prior will be blocked.</p>
            </div>
          </div>

          <!-- Rule 5: Same-Day Regularization Control -->
          <div class="rule-card">
            <div class="rule-icon">⚡</div>
            <div class="rule-body">
              <h3 class="rule-name">Same-Day Regularization</h3>
              <p class="rule-desc">Allow employees to raise regularization requests for today's attendance date.</p>
              
              <div class="checkbox-row mt-3">
                <label class="toggle-label">
                  <input type="checkbox" 
                         class="toggle-checkbox" 
                         [(ngModel)]="config.allowSameDayRegularization" />
                  <span class="toggle-text">{{ config.allowSameDayRegularization ? 'Allowed (Enabled)' : 'Disabled (Blocked)' }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Rule 6: Future-Date Regularization Control -->
          <div class="rule-card">
            <div class="rule-icon">🔮</div>
            <div class="rule-body">
              <h3 class="rule-name">Future-Date Regularization</h3>
              <p class="rule-desc">Allow employees to submit regularization for future attendance dates.</p>
              
              <div class="checkbox-row mt-3">
                <label class="toggle-label">
                  <input type="checkbox" 
                         class="toggle-checkbox" 
                         [(ngModel)]="config.allowFutureDateRegularization" />
                  <span class="toggle-text">{{ config.allowFutureDateRegularization ? 'Allowed (Enabled)' : 'Disabled (Blocked)' }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Rule 7: Standard Office In Time -->
          <div class="rule-card">
            <div class="rule-icon">🌅</div>
            <div class="rule-body">
              <h3 class="rule-name">Standard Office In Time</h3>
              <p class="rule-desc">Default shift start time. Check-ins after this time are marked as <strong>LATE</strong>.</p>
              
              <div class="input-group-row mt-3">
                <input type="time" 
                       class="form-control time-input" 
                       [(ngModel)]="config.standardInTime" />
              </div>
            </div>
          </div>

          <!-- Rule 8: Standard Office Out Time -->
          <div class="rule-card">
            <div class="rule-icon">🌆</div>
            <div class="rule-body">
              <h3 class="rule-name">Standard Office Out Time</h3>
              <p class="rule-desc">Default shift end time for total working hours calculation.</p>
              
              <div class="input-group-row mt-3">
                <input type="time" 
                       class="form-control time-input" 
                       [(ngModel)]="config.standardOutTime" />
              </div>
            </div>
          </div>
        </div>

        <!-- Action Footer -->
        <div class="card-footer">
          <div class="footer-info" *ngIf="config.updatedBy">
            Last updated by <strong>{{ config.updatedBy }}</strong> on {{ config.updatedDate | date:'medium' }}
          </div>
          <div class="footer-actions">
            <button class="btn btn-secondary" (click)="resetDefaults()">Reset Defaults</button>
            <button class="btn btn-primary btn-lg" [disabled]="isSaving" (click)="saveRules()">
              💾 Save & Apply Dynamic Rules
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .rule-config-container {
      padding: 1.5rem;
      max-width: 1100px;
      margin: 0 auto;
      font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
      color: #0f172a !important;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      background: #ffffff;
      padding: 1.25rem 1.5rem;
      border-radius: 14px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.04);
      border: 1px solid #e2e8f0;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 800 !important;
      color: #0f172a !important;
      margin: 0;
    }

    .page-subtitle {
      font-size: 0.875rem;
      font-weight: 700 !important;
      color: #0f172a !important;
      margin: 0.25rem 0 0 0;
    }

    .card {
      background: #ffffff;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 16px rgba(0,0,0,0.04);
      padding: 1.5rem;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .card-title {
      font-size: 1.2rem;
      font-weight: 800 !important;
      color: #0f172a !important;
      margin: 0;
    }

    .rules-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    @media (max-width: 768px) {
      .rules-grid {
        grid-template-columns: 1fr;
      }
    }

    .rule-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      gap: 1rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .highlight-card {
      border: 2px solid #891EA2;
      background: #fcf8ff;
    }

    .rule-card:hover {
      border-color: #891EA2;
      box-shadow: 0 4px 12px rgba(137, 30, 162, 0.08);
    }

    .rule-icon {
      font-size: 2.2rem;
      line-height: 1;
    }

    .rule-body {
      flex: 1;
    }

    .rule-name {
      font-size: 1rem;
      font-weight: 800 !important;
      color: #0f172a !important;
      margin: 0 0 0.35rem 0;
    }

    .rule-desc {
      font-size: 0.85rem;
      font-weight: 700 !important;
      color: #0f172a !important;
      margin: 0;
      line-height: 1.4;
    }

    .input-group-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .number-input {
      width: 110px;
      font-size: 1.1rem;
      font-weight: 800 !important;
      text-align: center;
      color: #0f172a !important;
    }

    .time-input {
      width: 150px;
      font-size: 1rem;
      font-weight: 800 !important;
      color: #0f172a !important;
    }

    .unit-label {
      font-size: 0.85rem;
      font-weight: 800 !important;
      color: #0f172a !important;
    }

    .rule-hint {
      font-size: 0.78rem;
      font-weight: 800 !important;
      color: #0f172a !important;
      margin: 0.6rem 0 0 0;
    }

    .form-control {
      padding: 0.6rem 0.85rem;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      outline: none;
    }

    .form-control:focus {
      border-color: #891EA2;
      box-shadow: 0 0 0 3px rgba(137, 30, 162, 0.15);
    }

    .toggle-label {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      cursor: pointer;
    }

    .toggle-checkbox {
      width: 20px;
      height: 20px;
      cursor: pointer;
      accent-color: #891EA2;
    }

    .toggle-text {
      font-size: 0.9rem;
      font-weight: 800 !important;
      color: #0f172a !important;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1.25rem;
      border-top: 1px solid #f1f5f9;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .footer-info {
      font-size: 0.85rem;
      font-weight: 800 !important;
      color: #0f172a !important;
    }

    .footer-actions {
      display: flex;
      gap: 1rem;
      margin-left: auto;
    }

    .btn {
      padding: 0.6rem 1.2rem;
      font-size: 0.9rem;
      font-weight: 800 !important;
      color: #0f172a !important;
      border-radius: 8px;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-lg {
      padding: 0.8rem 1.6rem;
      font-size: 1rem;
    }

    .btn-primary {
      background: #891EA2;
      color: #ffffff !important;
    }

    .btn-primary:hover:not(:disabled) {
      background: #731788;
    }

    .btn-secondary {
      background: #e2e8f0;
      color: #0f172a !important;
    }

    .btn-outline {
      background: transparent;
      border-color: #cbd5e1;
      color: #0f172a !important;
    }

    .btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .badge {
      padding: 0.3rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 800 !important;
      border-radius: 20px;
    }

    .badge-success {
      background: #dcfce7;
      color: #0f172a !important;
    }

    .mt-3 {
      margin-top: 0.85rem;
    }
  `]
})
export class HrRuleConfigComponent implements OnInit {
  config: HrmsRuleConfigData = {
    plannedLeaveAdvanceDays: 5,
    regularizationMaxDays: 7,
    maxRegularizationsPerMonth: 3,
    maxLeaveApplicationsPerMonth: 10,
    allowSameDayRegularization: true,
    allowFutureDateRegularization: false,
    standardInTime: '09:30',
    standardOutTime: '18:30'
  };

  isSaving: boolean = false;

  constructor(
    private api: ApiService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadRules();
  }

  loadRules(): void {
    this.api.get<HrmsRuleConfigData>('/rules/get').subscribe({
      next: (res: ApiResponse<HrmsRuleConfigData>) => {
        if (res.success && res.data) {
          this.config = {
            ...res.data,
            maxRegularizationsPerMonth: res.data.maxRegularizationsPerMonth ?? 3,
            maxLeaveApplicationsPerMonth: res.data.maxLeaveApplicationsPerMonth ?? 10,
            allowSameDayRegularization: res.data.allowSameDayRegularization ?? true,
            allowFutureDateRegularization: res.data.allowFutureDateRegularization ?? false
          };
        }
      },
      error: () => {}
    });
  }

  saveRules(): void {
    if (this.config.maxRegularizationsPerMonth == null || this.config.maxRegularizationsPerMonth < 0) {
      this.toast.error('Maximum regularizations per month cannot be negative');
      return;
    }
    if (this.config.maxLeaveApplicationsPerMonth == null || this.config.maxLeaveApplicationsPerMonth < 0) {
      this.toast.error('Maximum leave applications per month cannot be negative');
      return;
    }
    if (this.config.plannedLeaveAdvanceDays < 0) {
      this.toast.error('Planned Leave advance days cannot be negative');
      return;
    }
    if (this.config.regularizationMaxDays < 1) {
      this.toast.error('Regularization max days must be at least 1 day');
      return;
    }

    this.isSaving = true;
    this.api.post<HrmsRuleConfigData>('/rules/save', this.config).subscribe({
      next: (res: ApiResponse<HrmsRuleConfigData>) => {
        this.isSaving = false;
        if (res.success && res.data) {
          this.toast.success('HR Policy Dynamic Rules updated successfully!');
          this.config = {
            ...res.data,
            maxRegularizationsPerMonth: res.data.maxRegularizationsPerMonth ?? 3,
            maxLeaveApplicationsPerMonth: res.data.maxLeaveApplicationsPerMonth ?? 10,
            allowSameDayRegularization: res.data.allowSameDayRegularization ?? true,
            allowFutureDateRegularization: res.data.allowFutureDateRegularization ?? false
          };
        } else {
          this.toast.error(res.message || 'Failed to save dynamic rules');
        }
      },
      error: () => {
        this.isSaving = false;
      }
    });
  }

  resetDefaults(): void {
    this.config.plannedLeaveAdvanceDays = 5;
    this.config.regularizationMaxDays = 7;
    this.config.maxRegularizationsPerMonth = 3;
    this.config.maxLeaveApplicationsPerMonth = 10;
    this.config.allowSameDayRegularization = true;
    this.config.allowFutureDateRegularization = false;
    this.config.standardInTime = '09:30';
    this.config.standardOutTime = '18:30';
    this.toast.info('Reset to default values. Click "Save & Apply" to enforce.');
  }
}
