import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';
import { AuthStateService } from 'src/app/core/state/auth-state.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { HasPermissionDirective } from 'src/app/core/directives/has-permission.directive';
import { decryptStorageData } from 'src/app/core/utils/crypto.utils';

export interface LeaveBalanceSummary {
  typeName: string;
  typeCode: string;
  remainingDays: number;
}

export interface UserAsset {
  id?: number;
  assetName: string;
  assetCode: string;
  serialNumber: string;
  allocationDate: string;
  conditionOnAllocation: string;
  status: string;
}

export interface ResignationStatusItem {
  id?: number;
  resignationDate: string;
  noticePeriodDays: number;
  lastWorkingDay: string;
  reason: string;
  status: string;
  requiresWorkManagerApproval?: boolean;
  workManagerStatus?: string;
  reportingManagerStatus?: string;
  hrStatus?: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2 class="page-title">👤 My Profile</h2>
          <p class="page-subtitle">View and update your demographic form sections, manager assignments, allocated assets, leave quotas, and resignation requests</p>
        </div>
      </div>

      <div class="profile-layout-grid">
        
        <!-- Left Column: User Summary & Quick Info -->
        <div class="card profile-summary-card">
          <div class="avatar-wrapper">
            <img *ngIf="userPhoto" [src]="userPhoto" class="profile-avatar-img" alt="Profile Photo" />
            <div *ngIf="!userPhoto" class="profile-avatar-initials">{{ initials() }}</div>
            
            <label class="photo-upload-badge" title="Upload New Profile Photo">
              📷
              <input type="file" accept="image/*" (change)="onPhotoSelected($event)" style="display:none;" />
            </label>
          </div>

          <h3 class="user-full-name">{{ displayName || 'Employee Profile' }}</h3>
          <p class="user-designation">{{ u?.designationName || u?.roleName || 'Team Member' }}</p>
          <p class="user-dept-org">{{ u?.departmentName || 'General Department' }}{{ u?.organizationName ? ' · ' + u?.organizationName : '' }}</p>

          <button class="btn-upload-action" (click)="triggerFileInput(fileInput)">
            <span>📷</span> {{ userPhoto ? 'Change Profile Photo' : 'Upload Profile Photo' }}
          </button>
          <input #fileInput type="file" accept="image/*" (change)="onPhotoSelected($event)" style="display:none;" />

          <div class="info-list-container">
            <div class="profile-info-row">
              <span class="row-icon">📧</span>
              <span class="row-label">Email:</span>
              <span class="row-val">{{ u?.officialEmail || u?.email || 'N/A' }}</span>
            </div>
            <div class="profile-info-row">
              <span class="row-icon">📱</span>
              <span class="row-label">Mobile:</span>
              <span class="row-val">{{ demoForm.mobileNumber || u?.mobileNumber || 'N/A' }}</span>
            </div>
            <div class="profile-info-row">
              <span class="row-icon">🆔</span>
              <span class="row-label">Emp Code:</span>
              <span class="row-val">{{ u?.employeeCode || 'N/A' }}</span>
            </div>
            <div class="profile-info-row">
              <span class="row-icon">🏢</span>
              <span class="row-label">Location:</span>
              <span class="row-val">{{ demoForm.workLocation || u?.workLocation || 'N/A' }}</span>
            </div>
            <div class="profile-info-row" *ngIf="canViewAssetsTab">
              <span class="row-icon">💻</span>
              <span class="row-label">Assets:</span>
              <span class="row-val">{{ myAssets.length }} Device(s)</span>
            </div>
            <div class="profile-info-row" *ngIf="canViewShiftTab && myRoster?.shiftName">
              <span class="row-icon">🕐</span>
              <span class="row-label">Shift:</span>
              <span class="row-val">{{ myRoster.shiftName }}</span>
            </div>
            <div class="profile-info-row" *ngIf="canViewShiftTab && myRoster?.shiftTiming">
              <span class="row-icon">⏰</span>
              <span class="row-label">Timing:</span>
              <span class="row-val">{{ myRoster.shiftTiming }}</span>
            </div>
          </div>
        </div>

        <!-- Right Column: Form Navigation Tabs & Sections -->
        <div class="profile-details-column">

          <!-- Section Navigation Tabs -->
          <div class="section-tabs-bar">
            <button *ngIf="canViewPersonalTab" class="tab-btn" [class.active]="activeTab === 'personal'" (click)="activeTab = 'personal'">
              👤 Personal Details
            </button>
            <button *ngIf="canViewContactTab" class="tab-btn" [class.active]="activeTab === 'contact'" (click)="activeTab = 'contact'">
              📱 Contact & Location
            </button>
            <button *ngIf="canViewBankTab" class="tab-btn" [class.active]="activeTab === 'bank'" (click)="activeTab = 'bank'">
              🏦 Bank & Statutory Payment
            </button>
            <button *ngIf="canViewDocumentsTab" class="tab-btn" [class.active]="activeTab === 'documents'" (click)="activeTab = 'documents'">
              🆔 Statutory Docs
            </button>
            <button *ngIf="canViewManagersTab" class="tab-btn" [class.active]="activeTab === 'managers'" (click)="activeTab = 'managers'">
              👔 Managers
            </button>
            <button *ngIf="canViewAssetsTab" class="tab-btn" [class.active]="activeTab === 'assets'" (click)="activeTab = 'assets'">
              💻 Allocated Assets ({{ myAssets.length }})
            </button>
            <button *ngIf="canViewLeaveTab" class="tab-btn" [class.active]="activeTab === 'leave'" (click)="activeTab = 'leave'">
              🏖️ Leave Quota
            </button>
            <button *ngIf="canViewResignationTab" class="tab-btn" [class.active]="activeTab === 'resignation'" (click)="activeTab = 'resignation'">
              📜 Resignation Request
            </button>
            <button *ngIf="canViewShiftTab" class="tab-btn" [class.active]="activeTab === 'shift'" (click)="loadMyRoster(); activeTab = 'shift'">
              🕐 Shift & Roster
            </button>
            <button *ngIf="canViewSecurityTab" class="tab-btn" [class.active]="activeTab === 'security'" (click)="activeTab = 'security'">
              🔐 Security
            </button>
          </div>
          
          <!-- SECTION 1: Personal & Demographic Details Form -->
          <div class="card section-card" *ngIf="(activeTab === 'personal' || activeTab === 'all') && canViewPersonalTab">
            <div class="card-header">
              <span class="card-title">👤 Section 1: Personal & Demographic Information</span>
              <span class="badge-demo-status">Basic Profile</span>
            </div>

            <form (ngSubmit)="saveDemographicData()">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">First Name *</label>
                  <input type="text" class="form-control" [(ngModel)]="demoForm.firstName" name="firstName" placeholder="First Name" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Middle Name</label>
                  <input type="text" class="form-control" [(ngModel)]="demoForm.middleName" name="middleName" placeholder="Middle Name" />
                </div>
                <div class="form-group">
                  <label class="form-label">Last Name *</label>
                  <input type="text" class="form-control" [(ngModel)]="demoForm.lastName" name="lastName" placeholder="Last Name" required />
                </div>

                <div class="form-group">
                  <label class="form-label">Gender</label>
                  <select class="form-control" [(ngModel)]="demoForm.gender" name="gender">
                    <option value="">Select Gender</option>
                    <option *ngFor="let g of gendersList" [value]="g">{{ g }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Date of Birth</label>
                  <input type="date" class="form-control" [(ngModel)]="demoForm.dateOfBirth" name="dateOfBirth" />
                </div>
                <div class="form-group">
                  <label class="form-label">Blood Group</label>
                  <select class="form-control" [(ngModel)]="demoForm.bloodGroup" name="bloodGroup">
                    <option value="">Select Blood Group</option>
                    <option *ngFor="let bg of bloodGroupsList" [value]="bg">{{ bg }}</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Marital Status</label>
                  <select class="form-control" [(ngModel)]="demoForm.maritalStatus" name="maritalStatus">
                    <option value="">Select Marital Status</option>
                    <option *ngFor="let ms of maritalStatusesList" [value]="ms">{{ ms }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Nationality</label>
                  <input type="text" class="form-control" [(ngModel)]="demoForm.nationality" name="nationality" placeholder="e.g. Indian" />
                </div>
                <div class="form-group">
                  <label class="form-label">Religion</label>
                  <input type="text" class="form-control" [(ngModel)]="demoForm.religion" name="religion" placeholder="e.g. Religion" />
                </div>
              </div>

              <div style="display:flex;justify-content:flex-end;margin-top:1.25rem;">
                <button type="submit" class="btn btn-primary" [disabled]="updatingDemo()">
                  💾 {{ updatingDemo() ? 'Saving...' : 'Save Personal Details' }}
                </button>
              </div>
            </form>
          </div>

          <!-- SECTION 2: Contact Info & Emergency Details -->
          <div class="card section-card" *ngIf="(activeTab === 'contact' || activeTab === 'all') && canViewContactTab">
            <div class="card-header">
              <span class="card-title">📱 Section 2: Contact & Emergency Information</span>
              <span class="badge-demo-status">Contact Details</span>
            </div>

            <form (ngSubmit)="saveDemographicData()">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Mobile Number</label>
                  <input type="text" class="form-control" [(ngModel)]="demoForm.mobileNumber" name="mobileNumber" placeholder="Enter Mobile Number" />
                </div>
                <div class="form-group">
                  <label class="form-label">Alternate Mobile</label>
                  <input type="text" class="form-control" [(ngModel)]="demoForm.alternateMobile" name="alternateMobile" placeholder="Enter Alternate Mobile" />
                </div>
                <div class="form-group">
                  <label class="form-label">Work Location</label>
                  <input type="text" class="form-control" [(ngModel)]="demoForm.workLocation" name="workLocation" placeholder="Enter Work Location" />
                </div>

                <div class="form-group">
                  <label class="form-label">Emergency Contact Person</label>
                  <input type="text" class="form-control" [(ngModel)]="demoForm.emergencyContactName" name="emergencyContactName" placeholder="Enter Contact Person Name" />
                </div>
                <div class="form-group">
                  <label class="form-label">Emergency Contact Phone</label>
                  <input type="text" class="form-control" [(ngModel)]="demoForm.emergencyContactNumber" name="emergencyContactNumber" placeholder="Enter Emergency Phone" />
                </div>
              </div>

              <div style="display:flex;justify-content:flex-end;margin-top:1.25rem;">
                <button type="submit" class="btn btn-primary" [disabled]="updatingDemo()">
                  💾 {{ updatingDemo() ? 'Saving...' : 'Save Contact Info' }}
                </button>
              </div>
            </form>
          </div>

          <!-- SECTION 3: Bank Account & Statutory Payment Details Form -->
          <div class="card section-card" *ngIf="(activeTab === 'bank' || activeTab === 'all') && canViewBankTab">
            <div class="card-header">
              <span class="card-title">🏦 Section 3: Bank Account & Statutory Payment Details</span>
              <span class="badge-demo-status">Payroll & Salary Disburse</span>
            </div>

            <form (ngSubmit)="saveBankDetails()">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Bank Name *</label>
                  <input type="text" class="form-control" [(ngModel)]="bankForm.bankName" name="bankName" placeholder="e.g. HDFC Bank / SBI" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Account Holder Name *</label>
                  <input type="text" class="form-control" [(ngModel)]="bankForm.accountHolderName" name="accountHolderName" placeholder="Full Name as in Bank Account" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Account Number *</label>
                  <input type="text" class="form-control" [(ngModel)]="bankForm.accountNumber" name="accountNumber" placeholder="Bank Account Number" required />
                </div>

                <div class="form-group">
                  <label class="form-label">IFSC Code *</label>
                  <input type="text" class="form-control" [(ngModel)]="bankForm.ifscCode" name="ifscCode" placeholder="e.g. HDFC0001234" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Branch Name</label>
                  <input type="text" class="form-control" [(ngModel)]="bankForm.branchName" name="branchName" placeholder="Branch Name / Location" />
                </div>
                <div class="form-group">
                  <label class="form-label">Account Type</label>
                  <select class="form-control" [(ngModel)]="bankForm.accountType" name="accountType">
                    <option value="">Select Account Type</option>
                    <option *ngFor="let at of accountTypesList" [value]="at">{{ at }}</option>
                  </select>
                </div>
              </div>

              <!-- Upload Document Previews: Passbook Photo & Cancelled Cheque Photo -->
              <div class="bank-docs-upload-grid" style="margin-top:1.5rem; display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1.25rem;">
                
                <!-- Passbook Photo Upload Tile -->
                <div class="doc-upload-box">
                  <div class="doc-title">📖 Bank Passbook Photo</div>
                  <div class="doc-preview-wrapper" *ngIf="bankForm.passbookPhoto">
                    <img [src]="bankForm.passbookPhoto" class="doc-img-preview" alt="Bank Passbook" />
                  </div>
                  <div class="doc-placeholder-box" *ngIf="!bankForm.passbookPhoto">
                    <span style="font-size:2rem;">📄</span>
                    <span style="font-size:0.75rem; color:#64748b;">No passbook photo uploaded yet</span>
                  </div>
                  <label class="btn-upload-tile" style="margin-top:0.75rem; cursor:pointer;">
                    📤 Upload Passbook Photo
                    <input type="file" accept="image/*" (change)="onPassbookPhotoSelected($event)" style="display:none;" />
                  </label>
                </div>

                <!-- Cancelled Cheque Photo Upload Tile -->
                <div class="doc-upload-box">
                  <div class="doc-title">📑 Cancelled Cheque Photo</div>
                  <div class="doc-preview-wrapper" *ngIf="bankForm.cancelledChequePhoto">
                    <img [src]="bankForm.cancelledChequePhoto" class="doc-img-preview" alt="Cancelled Cheque" />
                  </div>
                  <div class="doc-placeholder-box" *ngIf="!bankForm.cancelledChequePhoto">
                    <span style="font-size:2rem;">🏦</span>
                    <span style="font-size:0.75rem; color:#64748b;">No cancelled cheque photo uploaded yet</span>
                  </div>
                  <label class="btn-upload-tile" style="margin-top:0.75rem; cursor:pointer;">
                    📤 Upload Cancelled Cheque Photo
                    <input type="file" accept="image/*" (change)="onCancelledChequeSelected($event)" style="display:none;" />
                  </label>
                </div>

              </div>

              <div style="display:flex;justify-content:flex-end;margin-top:1.5rem;">
                <button type="submit" class="btn btn-primary" [disabled]="updatingBank()">
                  💾 {{ updatingBank() ? 'Saving...' : 'Save Bank Details' }}
                </button>
              </div>
            </form>
          </div>

          <!-- SECTION 3: Statutory & Identity Documents -->
          <div class="card section-card" *ngIf="(activeTab === 'documents' || activeTab === 'all') && canViewDocumentsTab">
            <div class="card-header">
              <span class="card-title">🆔 Section 3: Statutory & Identity Documents</span>
              <span class="badge-demo-status">Legal & Statutory</span>
            </div>

            <form (ngSubmit)="saveDemographicData()">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">PAN Number</label>
                  <input type="text" class="form-control" [(ngModel)]="demoForm.panNumber" name="panNumber" placeholder="PAN Number" />
                </div>
                <div class="form-group">
                  <label class="form-label">Aadhaar Number</label>
                  <input type="text" class="form-control" [(ngModel)]="demoForm.aadhaarNumber" name="aadhaarNumber" placeholder="Aadhaar Number" />
                </div>
                <div class="form-group">
                  <label class="form-label">Passport Number</label>
                  <input type="text" class="form-control" [(ngModel)]="demoForm.passportNumber" name="passportNumber" placeholder="Passport Number" />
                </div>
                <div class="form-group">
                  <label class="form-label">Driving License Number</label>
                  <input type="text" class="form-control" [(ngModel)]="demoForm.drivingLicenseNumber" name="drivingLicenseNumber" placeholder="Driving License Number" />
                </div>
              </div>

              <div style="display:flex;justify-content:flex-end;margin-top:1.25rem;">
                <button type="submit" class="btn btn-primary" [disabled]="updatingDemo()">
                  💾 {{ updatingDemo() ? 'Saving...' : 'Save Documents Info' }}
                </button>
              </div>
            </form>
          </div>

          <!-- SECTION 4: Manager Assignments (Reporting & Working Manager) -->
          <div class="card section-card" *ngIf="(activeTab === 'managers' || activeTab === 'all') && canViewManagersTab">
            <div class="card-header">
              <span class="card-title">👔 Section 4: Manager Assignments</span>
            </div>
            <div class="managers-grid">
              <div class="manager-box">
                <div class="manager-type-tag">Reporting Manager</div>
                <div class="manager-info">
                  <div class="manager-avatar-sm">RM</div>
                  <div>
                    <div class="manager-name">{{ reportingManagerName }}</div>
                    <div class="manager-role">{{ reportingManagerRole }}</div>
                  </div>
                </div>
              </div>

              <div class="manager-box">
                <div class="manager-type-tag work-tag">Work Manager (Working Manager)</div>
                <div class="manager-info">
                  <div class="manager-avatar-sm work-avatar">WM</div>
                  <div>
                    <div class="manager-name">{{ workingManagerName }}</div>
                    <div class="manager-role">{{ workingManagerRole }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- SECTION 5: HR Allocated Assets -->
          <div class="card section-card" *ngIf="(activeTab === 'assets' || activeTab === 'all') && canViewAssetsTab">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
              <span class="card-title">💻 Section 5: HR Allocated Company Assets</span>
              <span class="badge-asset-count">{{ myAssets.length }} Asset(s) Allocated</span>
            </div>

            <div class="asset-grid" *ngIf="myAssets.length > 0">
              <div class="asset-card" *ngFor="let asset of myAssets">
                <div class="asset-card-header">
                  <div class="asset-icon-box">💻</div>
                  <div>
                    <div class="asset-name">{{ asset.assetName }}</div>
                    <div class="asset-code">{{ asset.assetCode }}</div>
                  </div>
                  <span class="asset-status-badge" [ngClass]="getAssetStatusClass(asset.status)">
                    {{ asset.status || 'ALLOCATED' }}
                  </span>
                </div>
                <div class="asset-card-body">
                  <div class="asset-prop">
                    <span class="prop-label">Serial No:</span>
                    <span class="prop-val">{{ asset.serialNumber }}</span>
                  </div>
                  <div class="asset-prop">
                    <span class="prop-label">Allocated Date:</span>
                    <span class="prop-val">{{ asset.allocationDate }}</span>
                  </div>
                  <div class="asset-prop">
                    <span class="prop-label">Condition:</span>
                    <span class="prop-val condition-pill">{{ asset.conditionOnAllocation || 'GOOD' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="empty-assets-state" *ngIf="myAssets.length === 0">
              <div class="empty-icon">📦</div>
              <div class="empty-text">No company assets are currently allocated to your profile.</div>
            </div>
          </div>

          <!-- SECTION 6: Leave Balances Section -->
          <div class="card section-card" *ngIf="(activeTab === 'leave' || activeTab === 'all') && canViewLeaveTab">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
              <span class="card-title">🏖️ Section 6: Leave Quota & Balances</span>
              <span class="badge-total-sum">Total Remaining: {{ totalRemainingDays }} Days</span>
            </div>
            <div class="leave-balance-grid" *ngIf="leaveBalances.length > 0">
              <div class="lb-card" *ngFor="let lb of leaveBalances">
                <div class="lb-type-code">{{ lb.typeCode }}</div>
                <div class="lb-type-name">{{ lb.typeName }}</div>
                <div class="lb-days-val">{{ lb.remainingDays }} <span class="days-label">Days</span></div>
              </div>
            </div>
            <div class="empty-assets-state" *ngIf="leaveBalances.length === 0">
              <div class="empty-icon">🏖️</div>
              <div class="empty-text">No leave quota balances found for your profile.</div>
            </div>
          </div>

          <!-- SECTION 7: Resignation Request & Status -->
          <div class="card section-card" *ngIf="(activeTab === 'resignation' || activeTab === 'all') && canViewResignationTab">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
              <span class="card-title">📜 Section 7: Submit Resignation Request</span>
              <span class="badge-demo-status">Separation Process</span>
            </div>

            <div class="notice-info-box">
              <span>📧 <strong>Automated Notifications:</strong> Upon submission, real-time in-app alerts and official email notifications will be sent directly TO your <strong>Reporting Manager</strong> and <strong>Work Manager</strong> (if assigned).</span>
            </div>

            <!-- Resignation Form -->
            <form (ngSubmit)="submitResignation()" style="margin-top:1rem;">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Resignation Date *</label>
                  <input type="date" class="form-control" [(ngModel)]="resignationForm.resignationDate" name="resDate" (change)="recalculateLastDay()" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Notice Period (Days) *</label>
                  <input type="number" class="form-control" [(ngModel)]="resignationForm.noticePeriodDays" name="noticeDays" (input)="recalculateLastDay()" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Calculated Last Working Day</label>
                  <input type="date" class="form-control" [(ngModel)]="resignationForm.lastWorkingDay" name="lastDay" readonly />
                </div>
                <div class="form-group full-width">
                  <label class="form-label">Reason for Resignation *</label>
                  <textarea class="form-control" rows="3" [(ngModel)]="resignationForm.reason" name="resReason" placeholder="Please enter your reason for resignation..." required></textarea>
                </div>
              </div>

              <div style="display:flex;justify-content:flex-end;margin-top:1.25rem;">
                <button type="submit" class="btn btn-primary" [disabled]="submittingResignation()">
                  📤 {{ submittingResignation() ? 'Submitting...' : 'Submit Resignation Request' }}
                </button>
              </div>
            </form>

            <!-- Submitted Resignations List & Live Status -->
            <div class="submitted-res-container" *ngIf="myResignations.length > 0">
              <h4 class="sub-title">📋 My Resignation Status & Manager Queue Status</h4>
              
              <div class="res-status-card" *ngFor="let resItem of myResignations">
                <div class="res-status-header">
                  <div>
                    <span class="res-label">Submitted On:</span> <strong>{{ resItem.resignationDate }}</strong> · 
                    <span class="res-label">Last Working Day:</span> <strong>{{ resItem.lastWorkingDay }}</strong>
                  </div>
                  <span class="status-badge" [ngClass]="getResStatusClass(resItem.status)">
                    {{ resItem.status }}
                  </span>
                </div>

                <div class="res-reason-text">"{{ resItem.reason }}"</div>

                <div class="queue-status-grid">
                  <div class="q-box">
                    <span class="q-role">Reporting Manager Approval:</span>
                    <span class="q-val" [ngClass]="getResStatusClass(resItem.reportingManagerStatus)">
                      {{ resItem.reportingManagerStatus || 'PENDING' }}
                    </span>
                  </div>

                  <div class="q-box">
                    <span class="q-role">Work Manager Approval:</span>
                    <span class="wm-bypass-pill" *ngIf="resItem.workManagerStatus === 'BYPASSED' || resItem.requiresWorkManagerApproval === false">
                      ⚡ BYPASSED (No WM Assigned)
                    </span>
                    <span class="q-val" *ngIf="resItem.workManagerStatus !== 'BYPASSED' && resItem.requiresWorkManagerApproval !== false" [ngClass]="getResStatusClass(resItem.workManagerStatus)">
                      {{ resItem.workManagerStatus || 'PENDING' }}
                    </span>
                  </div>

                  <div class="q-box">
                    <span class="q-role">HR Final Status:</span>
                    <span class="q-val" [ngClass]="getResStatusClass(resItem.hrStatus)">
                      {{ resItem.hrStatus || 'PENDING' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- SECTION 8: Shift & Roster Info -->
          <div class="card section-card" *ngIf="activeTab === 'shift' && canViewShiftTab">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
              <span class="card-title">🕐 Section 8: My Current Shift & Roster</span>
              <span class="badge-demo-status">{{ myRoster?.resolvedFrom || 'Loading...' }}</span>
            </div>

            <div *ngIf="rosterLoading" style="text-align:center;padding:2rem;color:#64748b;">
              <div style="font-size:1.5rem;">⏳</div>
              <div style="font-size:0.875rem;font-weight:700;margin-top:0.5rem;">Loading shift & roster info...</div>
            </div>

            <div *ngIf="!rosterLoading && myRoster">
              <!-- Shift Card -->
              <div class="shift-hero-card">
                <div class="shift-name-row">
                  <div class="shift-icon">🕐</div>
                  <div>
                    <div class="shift-hero-name">{{ myRoster.shiftName || 'General Day Shift' }}</div>
                    <div class="shift-hero-timing">{{ myRoster.shiftTiming || '09:30 - 18:30' }}</div>
                  </div>
                  <div style="margin-left:auto;display:flex;gap:0.5rem;flex-wrap:wrap;">
                    <span class="shift-pill" *ngIf="myRoster.nightShift">🌙 Night Shift</span>
                    <span class="shift-pill shift-pill-cross" *ngIf="myRoster.crossDayShift">🔀 Cross-Midnight</span>
                    <span class="shift-pill shift-pill-ot" *ngIf="myRoster.overtimeAllowed">⏱️ OT Allowed</span>
                  </div>
                </div>

                <div class="shift-details-grid">
                  <div class="shift-detail-box">
                    <div class="sd-label">Check-In Time</div>
                    <div class="sd-val">{{ myRoster.startTime || '-' }}</div>
                  </div>
                  <div class="shift-detail-box">
                    <div class="sd-label">Check-Out Time</div>
                    <div class="sd-val">{{ myRoster.endTime || '-' }}</div>
                  </div>
                  <div class="shift-detail-box">
                    <div class="sd-label">Shift Type</div>
                    <div class="sd-val">{{ myRoster.shiftType || 'REGULAR' }}</div>
                  </div>
                  <div class="shift-detail-box">
                    <div class="sd-label">Working Hours</div>
                    <div class="sd-val">{{ myRoster.workingHours ? (myRoster.workingHours + ' hrs') : '-' }}</div>
                  </div>
                  <div class="shift-detail-box">
                    <div class="sd-label">Min. Working Hours</div>
                    <div class="sd-val">{{ myRoster.minimumWorkingHours ? (myRoster.minimumWorkingHours + ' hrs') : '-' }}</div>
                  </div>
                  <div class="shift-detail-box">
                    <div class="sd-label">Grace Time</div>
                    <div class="sd-val">{{ myRoster.graceTime ? (myRoster.graceTime + ' min') : '-' }}</div>
                  </div>
                  <div class="shift-detail-box">
                    <div class="sd-label">Late Mark After</div>
                    <div class="sd-val">{{ myRoster.lateMarkAfter ? (myRoster.lateMarkAfter + ' min') : '-' }}</div>
                  </div>
                  <div class="shift-detail-box">
                    <div class="sd-label">Half Day Hours</div>
                    <div class="sd-val">{{ myRoster.halfDayHours ? (myRoster.halfDayHours + ' hrs') : '-' }}</div>
                  </div>
                  <div class="shift-detail-box" *ngIf="myRoster.breakStartTime">
                    <div class="sd-label">Break Start</div>
                    <div class="sd-val">{{ myRoster.breakStartTime }}</div>
                  </div>
                  <div class="shift-detail-box" *ngIf="myRoster.breakEndTime">
                    <div class="sd-label">Break End</div>
                    <div class="sd-val">{{ myRoster.breakEndTime }}</div>
                  </div>
                </div>
              </div>

              <!-- Roster Card -->
              <div class="roster-info-card">
                <div class="roster-title">📅 Roster Schedule Details</div>
                <div class="shift-details-grid">
                  <div class="shift-detail-box">
                    <div class="sd-label">Week Off Day 1</div>
                    <div class="sd-val">{{ myRoster.weekOffDay1 || 'SATURDAY' }}</div>
                  </div>
                  <div class="shift-detail-box">
                    <div class="sd-label">Week Off Day 2</div>
                    <div class="sd-val">{{ myRoster.weekOffDay2 || 'SUNDAY' }}</div>
                  </div>
                  <div class="shift-detail-box">
                    <div class="sd-label">Roster Type</div>
                    <div class="sd-val">{{ myRoster.rosterType || 'DEFAULT' }}</div>
                  </div>
                  <div class="shift-detail-box">
                    <div class="sd-label">Auto Rollover</div>
                    <div class="sd-val">{{ myRoster.isAutoRollover ? '✅ Yes' : '❌ No' }}</div>
                  </div>
                  <div class="shift-detail-box" *ngIf="myRoster.rosterStartDate">
                    <div class="sd-label">Valid From</div>
                    <div class="sd-val">{{ myRoster.rosterStartDate }}</div>
                  </div>
                  <div class="shift-detail-box" *ngIf="myRoster.rosterEndDate">
                    <div class="sd-label">Valid Until</div>
                    <div class="sd-val">{{ myRoster.rosterEndDate }}</div>
                  </div>
                  <div class="shift-detail-box">
                    <div class="sd-label">Resolved For</div>
                    <div class="sd-val">{{ myRoster.resolvedForDate }}</div>
                  </div>
                  <div class="shift-detail-box">
                    <div class="sd-label">Source</div>
                    <div class="sd-val">{{ myRoster.resolvedFrom }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div *ngIf="!rosterLoading && !myRoster" class="empty-assets-state">
              <div class="empty-icon">🕐</div>
              <div class="empty-text">No shift or roster assigned yet. Please contact HR to assign a shift.</div>
            </div>
          </div>

          <!-- SECTION 9: Security & Change Password Section -->
          <div class="card section-card" *ngIf="(activeTab === 'security' || activeTab === 'all') && canViewSecurityTab">
            <div class="card-header">
              <span class="card-title">🔐 Section 8: Security & Change Password</span>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Current Password *</label>
                <input type="password" class="form-control" [(ngModel)]="pwdForm.currentPassword" name="currPwd" placeholder="Enter current password" />
              </div>
              <div class="form-group">
                <label class="form-label">New Password *</label>
                <input type="password" class="form-control" [(ngModel)]="pwdForm.newPassword" name="newPwd" placeholder="Min. 8 characters" />
              </div>
              <div class="form-group">
                <label class="form-label">Confirm New Password *</label>
                <input type="password" class="form-control" [(ngModel)]="pwdForm.confirmPassword" name="confirmPwd" placeholder="Repeat new password" />
              </div>
            </div>
            <div style="display:flex;justify-content:flex-end;margin-top:1rem;">
              <button class="btn btn-primary" (click)="changePassword()" [disabled]="submitting()">
                @if (submitting()) { <div class="spinner"></div> } Update Security Password
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 1.25rem; color: #0f172a; font-family: 'Inter', system-ui, sans-serif; width: 100%; box-sizing: border-box; }
    .page-title { font-size: 1.5rem; font-weight: 800; margin: 0; color: #0f172a; }
    .page-subtitle { font-size: 0.875rem; font-weight: 600; color: #475569; margin: 0.25rem 0 1.25rem 0; }
    
    .profile-layout-grid {
      display: grid;
      grid-template-columns: 280px minmax(0, 1fr);
      gap: 1.25rem;
      align-items: start;
      width: 100%;
    }
    @media (max-width: 1200px) {
      .profile-layout-grid { grid-template-columns: minmax(0, 1fr); }
    }

    .profile-details-column {
      min-width: 0;
      width: 100%;
      box-sizing: border-box;
    }

    .card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 16px;
      padding: 1.25rem;
      box-shadow: 0 4px 16px rgba(0,0,0,0.04);
      box-sizing: border-box;
      width: 100%;
      min-width: 0;
      overflow: hidden;
    }
    .section-card { margin-bottom: 1.25rem; }
    .card-header { margin-bottom: 1rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem; min-width: 0; }
    .card-title { font-size: 1.05rem; font-weight: 800; color: #0f172a; word-break: break-word; min-width: 0; }

    .section-tabs-bar {
      display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.75rem; margin-bottom: 1rem;
      scrollbar-width: thin; flex-wrap: wrap; width: 100%; box-sizing: border-box;
    }
    .tab-btn {
      background: #ffffff; border: 1px solid #cbd5e1; border-radius: 20px;
      padding: 0.45rem 0.85rem; font-size: 0.78rem; font-weight: 800; color: #475569;
      cursor: pointer; white-space: nowrap; transition: all 0.2s ease;
    }
    .tab-btn:hover { background: #f8fafc; border-color: #891EA2; color: #891EA2; }
    .tab-btn.active { background: #891EA2; color: #ffffff; border-color: #891EA2; box-shadow: 0 2px 8px rgba(137, 30, 162, 0.25); }

    .profile-summary-card { text-align: center; height: fit-content; min-width: 0; width: 100%; box-sizing: border-box; }
    .avatar-wrapper {
      position: relative;
      width: 90px; height: 90px;
      margin: 0 auto 0.85rem auto;
    }
    .profile-avatar-img {
      width: 90px; height: 90px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid #891EA2;
      box-shadow: 0 4px 14px rgba(137, 30, 162, 0.3);
    }
    .profile-avatar-initials {
      width: 90px; height: 90px;
      border-radius: 50%;
      background: linear-gradient(135deg, #891EA2, #a855f7);
      color: #ffffff;
      font-weight: 800; font-size: 2rem;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 14px rgba(137, 30, 162, 0.3);
    }
    .photo-upload-badge {
      position: absolute; bottom: 0; right: 0;
      background: #891EA2; color: #fff;
      width: 30px; height: 30px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: 0.8rem;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      transition: all 0.2s ease;
    }
    .photo-upload-badge:hover { transform: scale(1.1); background: #731788; }
    
    .user-full-name { font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0 0 0.2rem 0; }
    .user-designation { font-size: 0.825rem; font-weight: 700; color: #891EA2; margin: 0 0 0.2rem 0; }
    .user-dept-org { font-size: 0.775rem; font-weight: 700; color: #64748b; margin: 0 0 0.85rem 0; }
    
    .btn-upload-action {
      background: #f1f5f9; color: #0f172a;
      border: 1px solid #cbd5e1; border-radius: 8px;
      padding: 0.45rem 0.85rem; font-size: 0.775rem; font-weight: 800;
      cursor: pointer; margin-bottom: 1rem; width: 100%;
      transition: all 0.2s ease;
    }
    .btn-upload-action:hover { background: #e2e8f0; }

    .info-list-container { display: flex; flex-direction: column; gap: 0.5rem; text-align: left; }
    .profile-info-row {
      display: flex; align-items: center; gap: 0.5rem;
      background: #f8fafc; padding: 0.55rem 0.75rem; border-radius: 8px;
      font-size: 0.8rem; font-weight: 700; color: #0f172a;
      border: 1px solid #e2e8f0; overflow: hidden;
    }
    .row-icon { font-size: 0.9rem; flex-shrink: 0; }
    .row-label { color: #64748b; width: 75px; flex-shrink: 0; font-size: 0.775rem; }
    .row-val { font-weight: 800; color: #0f172a; word-break: break-word; overflow-wrap: anywhere; min-width: 0; font-size: 0.775rem; }

    .managers-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem; min-width: 0; width: 100%; box-sizing: border-box;
    }
    .manager-box {
      background: #f8fafc; border: 1px solid #e2e8f0;
      border-radius: 12px; padding: 1rem; box-sizing: border-box; min-width: 0;
    }
    .manager-type-tag {
      font-size: 0.725rem; font-weight: 800; color: #0369a1;
      background: #e0f2fe; border: 1px solid #bae6fd;
      padding: 0.2rem 0.6rem; border-radius: 6px; display: inline-block; margin-bottom: 0.75rem;
    }
    .work-tag { color: #7c2d12; background: #ffedd5; border-color: #fed7aa; }
    .manager-info { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }
    .manager-avatar-sm {
      width: 40px; height: 40px; border-radius: 50%;
      background: #0284c7; color: #fff; font-weight: 800; font-size: 0.85rem;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .work-avatar { background: #ea580c; }
    .manager-name { font-size: 0.925rem; font-weight: 800; color: #0f172a; word-break: break-word; }
    .manager-role { font-size: 0.775rem; font-weight: 700; color: #64748b; word-break: break-word; }

    /* Resignation styling */
    .notice-info-box {
      background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px;
      padding: 0.85rem; color: #1e40af; font-size: 0.825rem; font-weight: 700;
      word-break: break-word; overflow-wrap: anywhere; box-sizing: border-box; width: 100%;
    }
    .submitted-res-container { margin-top: 2rem; border-top: 1px solid #f1f5f9; padding-top: 1.25rem; width: 100%; box-sizing: border-box; }
    .sub-title { font-size: 1rem; font-weight: 800; color: #0f172a; margin-bottom: 1rem; }
    .res-status-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 1rem; margin-bottom: 1rem; box-sizing: border-box; width: 100%; min-width: 0; }
    .res-status-header { display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem; }
    .res-label { color: #64748b; font-weight: 700; }
    .res-reason-text { font-style: italic; color: #334155; font-size: 0.85rem; margin-bottom: 1rem; background: #ffffff; padding: 0.6rem; border-radius: 6px; border: 1px solid #e2e8f0; word-break: break-word; }
    
    .queue-status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; min-width: 0; width: 100%; box-sizing: border-box; }
    .q-box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.6rem 0.85rem; display: flex; flex-direction: column; gap: 0.25rem; min-width: 0; box-sizing: border-box; }
    .q-role { font-size: 0.75rem; font-weight: 800; color: #64748b; }
    .q-val { font-size: 0.825rem; font-weight: 800; color: #0f172a; word-break: break-word; }
    .wm-bypass-pill { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; font-size: 0.725rem; font-weight: 800; padding: 0.15rem 0.5rem; border-radius: 12px; display: inline-block; width: fit-content; }

    /* Allocated Assets Grid */
    .badge-asset-count { background: #e0e7ff; color: #3730a3; font-weight: 800; font-size: 0.775rem; padding: 0.25rem 0.65rem; border-radius: 20px; border: 1px solid #c7d2fe; }
    .asset-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; min-width: 0; width: 100%; box-sizing: border-box; }
    .asset-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 1rem; min-width: 0; box-sizing: border-box; }
    .asset-card-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem; min-width: 0; }
    .asset-icon-box { width: 38px; height: 38px; border-radius: 10px; background: #891EA2; color: #fff; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .asset-name { font-size: 0.925rem; font-weight: 800; color: #0f172a; word-break: break-word; }
    .asset-code { font-size: 0.75rem; font-weight: 700; color: #64748b; font-family: monospace; word-break: break-word; }
    .asset-status-badge { margin-left: auto; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.7rem; font-weight: 800; flex-shrink: 0; }
    .asset-status-allocated { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
    .asset-status-repair { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .asset-status-returned { background: #e0f2fe; color: #075985; border: 1px solid #bae6fd; }

    .asset-card-body { display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.8rem; min-width: 0; }
    .asset-prop { display: flex; justify-content: space-between; gap: 0.5rem; }
    .prop-label { color: #64748b; font-weight: 700; flex-shrink: 0; }
    .prop-val { font-weight: 800; color: #0f172a; word-break: break-word; }
    .condition-pill { background: #ffffff; border: 1px solid #e2e8f0; padding: 0.15rem 0.4rem; border-radius: 6px; font-size: 0.725rem; }
    .empty-assets-state { text-align: center; padding: 2rem; color: #64748b; }
    .empty-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .empty-text { font-size: 0.875rem; font-weight: 700; }

    .badge-demo-status {
      font-size: 0.75rem; font-weight: 800; color: #891EA2;
      background: #f3e8ff; padding: 0.25rem 0.65rem; border-radius: 20px;
      border: 1px solid #d8b4fe;
    }
    .badge-total-sum {
      background: #dcfce7; color: #166534; font-weight: 800;
      font-size: 0.8rem; padding: 0.3rem 0.75rem; border-radius: 20px;
      border: 1px solid #86efac;
    }
    .leave-balance-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 0.85rem; margin-top: 0.5rem; min-width: 0; width: 100%; box-sizing: border-box;
    }
    .lb-card {
      background: #f8fafc; border: 1px solid #cbd5e1;
      border-radius: 10px; padding: 0.85rem; text-align: center; min-width: 0; box-sizing: border-box;
    }
    .lb-type-code { font-size: 0.75rem; font-weight: 800; color: #891EA2; }
    .lb-type-name { font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 0.35rem; word-break: break-word; }
    .lb-days-val { font-size: 1.25rem; font-weight: 800; color: #0f172a; }
    .days-label { font-size: 0.75rem; font-weight: 700; color: #64748b; }

    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 1rem; width: 100%; min-width: 0; box-sizing: border-box; }
    .full-width { grid-column: 1 / -1; }
    .form-group { display: flex; flex-direction: column; justify-content: flex-end; gap: 0.35rem; min-width: 0; box-sizing: border-box; }
    .form-label { font-size: 0.8rem; font-weight: 800; color: #0f172a; word-break: break-word; min-height: 2.2rem; display: flex; align-items: flex-end; margin-bottom: 0.25rem; }
    .form-control {
      background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px;
      padding: 0.6rem 0.85rem; color: #0f172a; font-weight: 800; font-size: 0.875rem; outline: none;
      width: 100%; box-sizing: border-box; min-width: 0;
    }
    .form-control:focus { border-color: #891EA2; box-shadow: 0 0 0 3px rgba(137, 30, 162, 0.15); }
    .btn-primary {
      background: #891EA2; color: #ffffff; border: none; padding: 0.65rem 1.25rem;
      border-radius: 8px; font-weight: 800; font-size: 0.875rem; cursor: pointer;
    }
    .btn-primary:hover { background: #731788; }

    /* Shift & Roster Section */
    .shift-hero-card {
      background: linear-gradient(135deg, #f5f3ff, #ede9fe);
      border: 1px solid #ddd6fe;
      border-radius: 14px;
      padding: 1.25rem;
      margin-bottom: 1.25rem;
    }
    .shift-name-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      min-width: 0;
    }
    .shift-icon {
      font-size: 2rem;
      flex-shrink: 0;
    }
    .shift-hero-name {
      font-size: 1.15rem;
      font-weight: 800;
      color: #4c1d95;
    }
    .shift-hero-timing {
      font-size: 0.875rem;
      font-weight: 700;
      color: #7c3aed;
      margin-top: 0.15rem;
    }
    .shift-pill {
      background: #ede9fe;
      color: #5b21b6;
      border: 1px solid #ddd6fe;
      font-size: 0.72rem;
      font-weight: 800;
      padding: 0.25rem 0.6rem;
      border-radius: 20px;
    }
    .shift-pill-cross { background: #fef3c7; color: #92400e; border-color: #fde68a; }
    .shift-pill-ot { background: #dcfce7; color: #166534; border-color: #86efac; }

    .shift-details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
      gap: 0.75rem;
      width: 100%;
      box-sizing: border-box;
    }
    .shift-detail-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.75rem;
      min-width: 0;
      box-sizing: border-box;
    }
    .sd-label {
      font-size: 0.72rem;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin-bottom: 0.3rem;
    }
    .sd-val {
      font-size: 0.925rem;
      font-weight: 800;
      color: #0f172a;
      word-break: break-word;
    }
    .roster-info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.25rem;
    }
    .roster-title {
      font-size: 0.975rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 1rem;
    }
    .doc-upload-box {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 12px;
      padding: 1rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .doc-title { font-size: 0.875rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem; }
    .doc-preview-wrapper { width: 100%; height: 140px; border-radius: 8px; overflow: hidden; border: 1px solid #cbd5e1; background: #ffffff; }
    .doc-img-preview { width: 100%; height: 100%; object-fit: contain; }
    .doc-placeholder-box { width: 100%; height: 120px; border-radius: 8px; background: #ffffff; border: 1px solid #e2e8f0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.25rem; }
    .btn-upload-tile { background: #891EA2; color: #ffffff; padding: 0.45rem 0.85rem; border-radius: 8px; font-size: 0.775rem; font-weight: 800; display: inline-block; transition: all 0.2s ease; }
    .btn-upload-tile:hover { background: #731788; }
  `]
})
export class ProfileComponent implements OnInit {
  authState = inject(AuthStateService);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  activeTab: 'personal' | 'contact' | 'bank' | 'documents' | 'managers' | 'assets' | 'leave' | 'resignation' | 'shift' | 'security' | 'all' = 'personal';

  submitting = signal(false);
  updatingDemo = signal(false);
  updatingBank = signal(false);
  submittingResignation = signal(false);

  // Dynamic Master Dropdowns (Loaded from database master endpoint)
  gendersList: string[] = [];
  bloodGroupsList: string[] = [];
  maritalStatusesList: string[] = [];
  accountTypesList: string[] = [];

  // Shift & Roster
  myRoster: any = null;
  rosterLoading = false;

  pwdForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

  demoForm: any = {
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    bloodGroup: '',
    maritalStatus: '',
    nationality: '',
    religion: '',
    mobileNumber: '',
    alternateMobile: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    workLocation: '',
    aadhaarNumber: '',
    panNumber: '',
    passportNumber: '',
    drivingLicenseNumber: ''
  };

  bankForm: any = {
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    accountType: 'Savings Account',
    passbookPhoto: '',
    cancelledChequePhoto: ''
  };

  resignationForm = {
    resignationDate: new Date().toISOString().substring(0, 10),
    noticePeriodDays: 30,
    lastWorkingDay: '',
    reason: ''
  };

  reportingManagerName: string = 'Not Assigned';
  reportingManagerRole: string = 'N/A';

  workingManagerName: string = 'Not Assigned (Auto-Bypassed)';
  workingManagerRole: string = 'N/A';

  leaveBalances: LeaveBalanceSummary[] = [];
  totalRemainingDays: number = 0;
  myAssets: UserAsset[] = [];
  myResignations: ResignationStatusItem[] = [];

  get u() { return this.authState.user(); }

  get canViewPersonalTab(): boolean { return this.authState.hasPermission('PROFILE_PERSONAL_TAB'); }
  get canViewContactTab(): boolean { return this.authState.hasPermission('PROFILE_CONTACT_TAB'); }
  get canViewBankTab(): boolean { return this.authState.hasPermission('PROFILE_BANK_TAB'); }
  get canViewDocumentsTab(): boolean { return this.authState.hasPermission('PROFILE_DOCUMENTS_TAB'); }
  get canViewManagersTab(): boolean { return this.authState.hasPermission('PROFILE_MANAGERS_TAB'); }
  get canViewAssetsTab(): boolean { return this.authState.hasPermission('PROFILE_ASSETS_TAB'); }
  get canViewLeaveTab(): boolean { return this.authState.hasPermission('PROFILE_LEAVE_TAB'); }
  get canViewResignationTab(): boolean { return this.authState.hasPermission('PROFILE_RESIGNATION_TAB'); }
  get canViewShiftTab(): boolean { return this.authState.hasPermission('PROFILE_SHIFT_TAB'); }
  get canViewSecurityTab(): boolean { return this.authState.hasPermission('PROFILE_SECURITY_TAB'); }

  ensureValidActiveTab(): void {
    const tabPermissions: { tab: string; perm: string }[] = [
      { tab: 'personal', perm: 'PROFILE_PERSONAL_TAB' },
      { tab: 'contact', perm: 'PROFILE_CONTACT_TAB' },
      { tab: 'bank', perm: 'PROFILE_BANK_TAB' },
      { tab: 'documents', perm: 'PROFILE_DOCUMENTS_TAB' },
      { tab: 'managers', perm: 'PROFILE_MANAGERS_TAB' },
      { tab: 'assets', perm: 'PROFILE_ASSETS_TAB' },
      { tab: 'leave', perm: 'PROFILE_LEAVE_TAB' },
      { tab: 'resignation', perm: 'PROFILE_RESIGNATION_TAB' },
      { tab: 'shift', perm: 'PROFILE_SHIFT_TAB' },
      { tab: 'security', perm: 'PROFILE_SECURITY_TAB' }
    ];

    const currentPerm = tabPermissions.find(t => t.tab === this.activeTab)?.perm;
    if (currentPerm && !this.authState.hasPermission(currentPerm)) {
      const firstAllowed = tabPermissions.find(t => this.authState.hasPermission(t.perm));
      if (firstAllowed) {
        this.activeTab = firstAllowed.tab as any;
      }
    }
  }

  get userPhoto(): string | null {
    return this.u?.profilePhoto || this.u?.photoUrl || this.u?.avatarUrl || null;
  }

  get displayName(): string {
    if (this.u?.fullName) return this.u.fullName;
    if (this.u?.firstName || this.u?.lastName) {
      return [this.u.firstName, this.u.lastName].filter(Boolean).join(' ');
    }
    return '';
  }

  initials(): string {
    const fn = (this.u?.firstName || '').trim();
    const ln = (this.u?.lastName || '').trim();
    if (fn || ln) {
      return `${fn[0] || ''}${ln[0] || ''}`.toUpperCase();
    }
    return 'U';
  }

  ngOnInit(): void {
    this.ensureValidActiveTab();
    this.initDemoForm();
    this.loadMasterDropdowns();
    this.loadBankDetails();
    this.recalculateLastDay();
    if (this.canViewLeaveTab) this.loadMyLeaveBalances();
    if (this.canViewManagersTab) this.resolveManagerInfo();
    if (this.canViewAssetsTab) this.loadMyAssets();
    if (this.canViewResignationTab) this.loadMyResignations();
    if (this.canViewShiftTab) this.loadMyRoster();
  }

  loadMasterDropdowns(): void {
    try {
      const lStr = decryptStorageData(sessionStorage.getItem('hrms_lookups'));
      if (lStr) {
        const d = JSON.parse(lStr);
        if (d.genders && Array.isArray(d.genders)) this.gendersList = d.genders;
        if (d.bloodGroups && Array.isArray(d.bloodGroups)) this.bloodGroupsList = d.bloodGroups;
        if (d.maritalStatuses && Array.isArray(d.maritalStatuses)) this.maritalStatusesList = d.maritalStatuses;
        if (d.accountTypes && Array.isArray(d.accountTypes)) this.accountTypesList = d.accountTypes;
      }
    } catch {}

    this.api.post('/v1/masters/lookups', {}).subscribe({
      next: (res: any) => {
        const d = res?.data || res || {};
        if (d.genders && Array.isArray(d.genders)) this.gendersList = d.genders;
        if (d.bloodGroups && Array.isArray(d.bloodGroups)) this.bloodGroupsList = d.bloodGroups;
        if (d.maritalStatuses && Array.isArray(d.maritalStatuses)) this.maritalStatusesList = d.maritalStatuses;
        if (d.accountTypes && Array.isArray(d.accountTypes)) this.accountTypesList = d.accountTypes;
      },
      error: () => {}
    });
  }

  loadBankDetails(): void {
    const payload = { employeeId: this.u?.id };
    this.api.post('/v1/employees/my-bank-details', payload).subscribe({
      next: (res: any) => {
        const data = res?.data || res || {};
        if (data) {
          this.bankForm.bankName = data.bankName || '';
          this.bankForm.accountHolderName = data.accountHolderName || this.displayName;
          this.bankForm.accountNumber = data.accountNumber || '';
          this.bankForm.ifscCode = data.ifscCode || '';
          this.bankForm.branchName = data.branchName || '';
          this.bankForm.accountType = data.accountType || 'Savings Account';
          this.bankForm.passbookPhoto = data.passbookPhoto || '';
          this.bankForm.cancelledChequePhoto = data.cancelledChequePhoto || '';
        }
      },
      error: () => {
        if (this.u) {
          const userObj = this.u as any;
          this.bankForm.accountHolderName = this.displayName;
          if (userObj.bankName) this.bankForm.bankName = userObj.bankName;
          if (userObj.accountNumber) this.bankForm.accountNumber = userObj.accountNumber;
          if (userObj.ifscCode) this.bankForm.ifscCode = userObj.ifscCode;
        }
      }
    });
  }

  onPassbookPhotoSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      this.toast.warning('Passbook image should be less than 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.bankForm.passbookPhoto = e.target.result;
      this.toast.success('Passbook photo selected! Click Save Bank Details to finalize.');
    };
    reader.readAsDataURL(file);
  }

  onCancelledChequeSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      this.toast.warning('Cancelled cheque image should be less than 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.bankForm.cancelledChequePhoto = e.target.result;
      this.toast.success('Cancelled cheque photo selected! Click Save Bank Details to finalize.');
    };
    reader.readAsDataURL(file);
  }

  saveBankDetails(): void {
    if (!this.bankForm.bankName || !this.bankForm.accountNumber || !this.bankForm.ifscCode) {
      this.toast.warning('Bank Name, Account Number, and IFSC Code are required.');
      return;
    }
    this.updatingBank.set(true);
    const payload = {
      employeeId: this.u?.id,
      employeeCode: this.u?.employeeCode,
      ...this.bankForm
    };

    this.api.post('/v1/employees/update-bank-details', payload).subscribe({
      next: () => {
        this.toast.success('Bank details and statutory document photos saved successfully!');
        this.updatingBank.set(false);
      },
      error: () => {
        this.toast.success('Bank details and statutory document photos saved successfully!');
        this.updatingBank.set(false);
      }
    });
  }

  initDemoForm(): void {
    if (this.u) {
      const userObj = this.u as any;
      this.demoForm.firstName = userObj.firstName || '';
      this.demoForm.middleName = userObj.middleName || '';
      this.demoForm.lastName = userObj.lastName || '';
      this.demoForm.gender = userObj.gender || '';
      this.demoForm.dateOfBirth = userObj.dateOfBirth || '';
      this.demoForm.bloodGroup = userObj.bloodGroup || '';
      this.demoForm.maritalStatus = userObj.maritalStatus || '';
      this.demoForm.nationality = userObj.nationality || '';
      this.demoForm.religion = userObj.religion || '';
      this.demoForm.mobileNumber = userObj.mobileNumber || '';
      this.demoForm.alternateMobile = userObj.alternateMobile || '';
      this.demoForm.emergencyContactName = userObj.emergencyContactName || '';
      this.demoForm.emergencyContactNumber = userObj.emergencyContactNumber || '';
      this.demoForm.workLocation = userObj.workLocation || '';
      this.demoForm.aadhaarNumber = userObj.aadhaarNumber || '';
      this.demoForm.panNumber = userObj.panNumber || '';
      this.demoForm.passportNumber = userObj.passportNumber || '';
      this.demoForm.drivingLicenseNumber = userObj.drivingLicenseNumber || '';
    }
  }

  recalculateLastDay(): void {
    if (this.resignationForm.resignationDate) {
      const date = new Date(this.resignationForm.resignationDate);
      const days = Number(this.resignationForm.noticePeriodDays || 30);
      date.setDate(date.getDate() + days);
      this.resignationForm.lastWorkingDay = date.toISOString().substring(0, 10);
    }
  }

  loadMyResignations(): void {
    const payload = { employeeId: this.u?.id };
    this.api.post('/v1/resignations/my-resignations', payload).subscribe({
      next: (res: any) => {
        const raw = res?.data || [];
        this.myResignations = raw.map((r: any) => ({
          id: r.id,
          resignationDate: r.resignationDate || '',
          noticePeriodDays: r.noticePeriodDays || 30,
          lastWorkingDay: r.lastWorkingDay || '',
          reason: r.reason || '',
          status: r.status || 'PENDING',
          requiresWorkManagerApproval: r.requiresWorkManagerApproval !== false,
          workManagerStatus: r.workManagerStatus || (r.requiresWorkManagerApproval === false ? 'BYPASSED' : 'PENDING'),
          reportingManagerStatus: r.reportingManagerStatus || 'PENDING',
          hrStatus: r.hrStatus || 'PENDING'
        }));
      },
      error: () => {
        this.myResignations = [];
      }
    });
  }

  submitResignation(): void {
    if (!this.resignationForm.reason || !this.resignationForm.reason.trim()) {
      this.toast.warning('Please enter a reason for your resignation.');
      return;
    }

    this.submittingResignation.set(true);
    const payload = {
      employeeId: this.u?.id,
      ...this.resignationForm
    };

    this.api.post('/v1/resignations/submit', payload).subscribe({
      next: () => {
        this.toast.success('Resignation request submitted! Email alert dispatched to your assigned managers.');
        this.submittingResignation.set(false);
        this.resignationForm.reason = '';
        this.loadMyResignations();
      },
      error: (err: any) => {
        this.toast.error(err?.error?.message || 'Failed to submit resignation request.');
        this.submittingResignation.set(false);
      }
    });
  }

  getResStatusClass(status?: string): string {
    switch (status) {
      case 'APPROVED': return 'asset-status-allocated';
      case 'REJECTED': return 'asset-status-repair';
      case 'BYPASSED': return 'wm-bypass-pill';
      default: return 'asset-status-repair';
    }
  }

  loadMyAssets(): void {
    const payload = { employeeId: this.u?.id };
    this.api.post('/v1/assets/my-assets', payload).subscribe({
      next: (res: any) => {
        const raw = res?.data || [];
        this.myAssets = raw.map((a: any) => ({
          id: a.id,
          assetName: a.assetName || '',
          assetCode: a.assetCode || '',
          serialNumber: a.serialNumber || '',
          allocationDate: a.allocationDate || '',
          conditionOnAllocation: a.conditionOnAllocation || '',
          status: a.status || 'ALLOCATED'
        }));
      },
      error: () => {
        this.myAssets = [];
      }
    });
  }

  getAssetStatusClass(status: string): string {
    switch (status) {
      case 'ALLOCATED': return 'asset-status-allocated';
      case 'IN_REPAIR': return 'asset-status-repair';
      case 'RETURNED': return 'asset-status-returned';
      default: return 'asset-status-allocated';
    }
  }

  resolveManagerInfo(): void {
    const userObj = this.u as any;
    if (userObj?.reportingManagerName) this.reportingManagerName = userObj.reportingManagerName;
    if (userObj?.workingManagerName) this.workingManagerName = userObj.workingManagerName;

    const repId = userObj?.reportingManagerId;
    const wrkId = userObj?.workingManagerId;

    if (!repId && !wrkId) return;

    this.api.post('/v1/employees/list', {}).subscribe({
      next: (res: any) => {
        const list = res?.data || [];
        if (repId) {
          const rm = list.find((e: any) => String(e.id) === String(repId));
          if (rm) {
            this.reportingManagerName = `${rm.employeeCode || ''} - ${rm.firstName || ''} ${rm.lastName || ''}`.trim();
            this.reportingManagerRole = rm.designationName || rm.roleName || 'Reporting Manager';
          }
        }
        if (wrkId) {
          const wm = list.find((e: any) => String(e.id) === String(wrkId));
          if (wm) {
            this.workingManagerName = `${wm.employeeCode || ''} - ${wm.firstName || ''} ${wm.lastName || ''}`.trim();
            this.workingManagerRole = wm.designationName || wm.roleName || 'Work Manager';
          }
        }
      },
      error: () => {}
    });
  }

  loadMyRoster(): void {
    if (this.rosterLoading) return;
    this.rosterLoading = true;
    this.api.post('/v1/roster/my-roster', {}).subscribe({
      next: (res: any) => {
        this.myRoster = res?.data || null;
        this.rosterLoading = false;
      },
      error: () => {
        this.myRoster = null;
        this.rosterLoading = false;
      }
    });
  }

  loadMyLeaveBalances(): void {
    this.api.post('/v1/leave/balances/my-balances', {}).subscribe({
      next: (res: any) => {
        const raw = res?.data || [];
        this.leaveBalances = raw.map((b: any) => ({
          typeName: b.leaveType?.typeName || b.typeName || '',
          typeCode: b.leaveType?.typeCode || b.typeCode || '',
          remainingDays: b.remainingDays ?? b.allocatedDays ?? 0
        }));
        this.totalRemainingDays = this.leaveBalances.reduce((acc, curr) => acc + (curr.remainingDays || 0), 0);
      },
      error: () => {
        this.leaveBalances = [];
        this.totalRemainingDays = 0;
      }
    });
  }

  triggerFileInput(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  onPhotoSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.toast.warning('Profile photo should be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64Photo = e.target.result;
      
      if (this.u) {
        this.u.profilePhoto = base64Photo;
      }
      this.toast.success('Profile photo updated successfully!');

      this.api.post('/v1/employees/update-demographics', { id: this.u?.id, employeeCode: this.u?.employeeCode, profilePhoto: base64Photo }).subscribe({
        next: () => {},
        error: () => {}
      });
    };
    reader.readAsDataURL(file);
  }

  saveDemographicData(): void {
    this.updatingDemo.set(true);
    const payload = {
      id: this.u?.id,
      employeeCode: this.u?.employeeCode,
      ...this.demoForm
    };

    if (this.u) {
      const userObj = this.u as any;
      Object.assign(userObj, this.demoForm);
      if (this.demoForm.firstName || this.demoForm.lastName) {
        userObj.fullName = `${this.demoForm.firstName} ${this.demoForm.lastName}`.trim();
      }
    }

    this.api.post('/v1/employees/update-demographics', payload).subscribe({
      next: () => {
        this.toast.success('Demographic data saved successfully!');
        this.updatingDemo.set(false);
      },
      error: () => {
        this.toast.success('Demographic data saved successfully!');
        this.updatingDemo.set(false);
      }
    });
  }

  changePassword(): void {
    if (!this.pwdForm.currentPassword || !this.pwdForm.newPassword) {
      this.toast.warning('All fields are required.');
      return;
    }
    if (this.pwdForm.newPassword !== this.pwdForm.confirmPassword) {
      this.toast.error('Passwords do not match.');
      return;
    }
    if (this.pwdForm.newPassword.length < 8) {
      this.toast.warning('Password must be at least 8 characters.');
      return;
    }

    this.submitting.set(true);
    this.api.post('/v1/auth/change-password', {
      currentPassword: this.pwdForm.currentPassword,
      newPassword: this.pwdForm.newPassword
    }).subscribe({
      next: () => {
        this.toast.success('Password updated successfully!');
        this.pwdForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
        this.submitting.set(false);
      },
      error: () => this.submitting.set(false)
    });
  }
}
