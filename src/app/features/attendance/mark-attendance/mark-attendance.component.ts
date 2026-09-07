import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, ApiResponse } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

export interface AttendanceRecord {
  id?: number;
  attendanceDate: string;
  inTime?: string;
  outTime?: string;
  totalHours?: number;
  status?: string;
  isLate?: boolean;
  isEarlyDeparture?: boolean;
  shift?: any;
  checkInSelfie?: string;
  checkOutSelfie?: string;
  checkInLocation?: string;
  checkOutLocation?: string;
  remarks?: string;
}

@Component({
  selector: 'app-mark-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="attendance-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Live Selfie Attendance & Regularization</h1>
          <p class="page-subtitle">Mark daily check-in/out with live webcam photo & view monthly attendance records</p>
        </div>
        <div class="live-clock-card">
          <div class="clock-time">{{ currentTimeStr }}</div>
          <div class="clock-date">{{ currentDateStr }}</div>
        </div>
      </div>

      <!-- Main Grid Layout -->
      <div class="attendance-grid">
        
        <!-- Left Column: WebCam Live Camera Feed & Capture -->
        <div class="card camera-card">
          <div class="card-header">
            <h2 class="card-title">
              <span class="pulse-dot" [class.active]="isCameraActive"></span>
              Live Camera Feed
            </h2>
            <span class="badge" [class.badge-success]="isCameraActive" [class.badge-neutral]="!isCameraActive">
              {{ isCameraActive ? 'Camera Active' : 'Camera Standby' }}
            </span>
          </div>

          <div class="camera-viewport">
            <!-- Video Stream -->
            <video #videoElement 
                   [class.hidden]="capturedSelfie || !isCameraActive" 
                   autoplay 
                   playsinline 
                   muted 
                   class="webcam-video"></video>

            <!-- Captured Image Preview -->
            <div *ngIf="capturedSelfie" class="captured-preview-container">
              <img [src]="capturedSelfie" alt="Live Captured Selfie" class="captured-img" />
              <div class="captured-overlay-badge">Captured Snapshot</div>
            </div>

            <!-- Fallback when camera is disabled / off -->
            <div *ngIf="!isCameraActive && !capturedSelfie" class="camera-placeholder">
              <div class="placeholder-icon">📸</div>
              <p class="placeholder-text">Camera stream is stopped or permission denied.</p>
              <button class="btn btn-primary btn-sm" (click)="startCamera()">
                <span class="icon">📷</span> Enable Live Camera
              </button>
            </div>

            <canvas #canvasElement class="hidden-canvas"></canvas>
          </div>

          <!-- Camera Actions -->
          <div class="camera-actions">
            <ng-container *ngIf="!capturedSelfie">
              <button *ngIf="isCameraActive" class="btn btn-primary btn-capture" (click)="captureSnapshot()">
                <span class="icon">📸</span> Take Snapshot Photo
              </button>
              <button *ngIf="isCameraActive" class="btn btn-outline btn-sm" (click)="stopCamera()">
                Stop Camera
              </button>
              <label class="btn btn-secondary btn-sm file-upload-label">
                📁 Upload Photo
                <input type="file" accept="image/*" (change)="onFileSelected($event)" hidden />
              </label>
            </ng-container>

            <ng-container *ngIf="capturedSelfie">
              <button class="btn btn-warning" (click)="retakePhoto()">
                🔄 Retake Photo
              </button>
            </ng-container>
          </div>

          <!-- Location & Remarks Input -->
          <div class="meta-form">
            <div class="form-group">
              <label class="form-label">
                Location / Work Address
                <button type="button" class="btn-text-action" (click)="detectLocation()">📍 Auto Detect GPS</button>
              </label>
              <input type="text" 
                     class="form-control" 
                     [(ngModel)]="locationText" 
                     placeholder="e.g. Main Office, Building A / Remote" />
            </div>

            <div class="form-group">
              <label class="form-label">Remarks / Work Summary (Optional)</label>
              <input type="text" 
                     class="form-control" 
                     [(ngModel)]="remarksText" 
                     placeholder="e.g. Working on client project" />
            </div>
          </div>

          <!-- Submit Buttons -->
          <div class="action-buttons-group">
            <button class="btn btn-success btn-lg flex-1" 
                    [disabled]="isSubmitting || !!todayRecord?.inTime" 
                    (click)="submitAttendance('check-in')">
              <span class="icon">📥</span> 
              {{ todayRecord?.inTime ? 'Checked In (' + todayRecord?.inTime + ')' : 'Mark Check-In' }}
            </button>

            <button class="btn btn-danger btn-lg flex-1" 
                    [disabled]="isSubmitting || !todayRecord?.inTime || !!todayRecord?.outTime" 
                    (click)="submitAttendance('check-out')">
              <span class="icon">📤</span> 
              {{ todayRecord?.outTime ? 'Checked Out (' + todayRecord?.outTime + ')' : 'Mark Check-Out' }}
            </button>
          </div>
        </div>

        <!-- Right Column: Today's Status & Selfies -->
        <div class="right-column">
          <!-- Today's Status Card -->
          <div class="card status-card">
            <div class="card-header">
              <h2 class="card-title">Today's Attendance Status</h2>
              <span class="badge" 
                    [class.badge-success]="todayRecord?.status === 'PRESENT'"
                    [class.badge-warning]="todayRecord?.status === 'LATE'"
                    [class.badge-neutral]="!todayRecord">
                {{ todayRecord ? todayRecord.status : 'NOT MARKED' }}
              </span>
            </div>

            <div class="status-summary-grid">
              <div class="status-box">
                <span class="status-label">Check-In Time</span>
                <span class="status-value highlight-in">{{ todayRecord?.inTime || '--:--' }}</span>
                <span class="status-sub" *ngIf="todayRecord?.checkInLocation">📍 {{ todayRecord?.checkInLocation }}</span>
              </div>

              <div class="status-box">
                <span class="status-label">Check-Out Time</span>
                <span class="status-value highlight-out">{{ todayRecord?.outTime || '--:--' }}</span>
                <span class="status-sub" *ngIf="todayRecord?.checkOutLocation">📍 {{ todayRecord?.checkOutLocation }}</span>
              </div>

              <div class="status-box full-width">
                <span class="status-label">Total Hours Worked Today</span>
                <span class="status-value">{{ todayRecord?.totalHours ? todayRecord?.totalHours + ' hrs' : '0.00 hrs' }}</span>
              </div>
            </div>

            <!-- Selfies Preview Cards -->
            <div class="selfie-previews-container">
              <div class="selfie-card">
                <div class="selfie-title">Check-In Selfie</div>
                <div class="selfie-frame">
                  <img *ngIf="todayRecord?.checkInSelfie" [src]="todayRecord?.checkInSelfie" class="selfie-thumb" alt="Check-in Selfie" />
                  <div *ngIf="!todayRecord?.checkInSelfie" class="selfie-empty">No Check-In Selfie</div>
                </div>
              </div>

              <div class="selfie-card">
                <div class="selfie-title">Check-Out Selfie</div>
                <div class="selfie-frame">
                  <img *ngIf="todayRecord?.checkOutSelfie" [src]="todayRecord?.checkOutSelfie" class="selfie-thumb" alt="Check-out Selfie" />
                  <div *ngIf="!todayRecord?.checkOutSelfie" class="selfie-empty">No Check-Out Selfie</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Guidelines -->
          <div class="card guidelines-card">
            <h3 class="guidelines-title">📌 Policy Guidelines & Regularization Rules</h3>
            <ul class="guidelines-list">
              <li>Standard Office Hours start at <strong>09:30 AM</strong>. Check-ins after 09:30 AM are tagged <strong>LATE</strong>.</li>
              <li>Missing punch regularization requests must be raised within <strong>7 days (1 week)</strong> of the date.</li>
              <li>Planned Leave applications must be submitted at least <strong>5 days</strong> in advance.</li>
            </ul>
          </div>
        </div>

      </div>

      <!-- Monthly Attendance Summary Cards -->
      <div class="metrics-grid mt-4">
        <div class="metric-card">
          <span class="metric-label">Total Workdays</span>
          <span class="metric-value">{{ totalWorkdays }}</span>
        </div>
        <div class="metric-card card-green">
          <span class="metric-label">Present Days</span>
          <span class="metric-value text-success">{{ presentCount }}</span>
        </div>
        <div class="metric-card card-yellow">
          <span class="metric-label">Late Days</span>
          <span class="metric-value text-warning">{{ lateCount }}</span>
        </div>
        <div class="metric-card card-red">
          <span class="metric-label">Absent Days</span>
          <span class="metric-value text-danger">{{ absentCount }}</span>
        </div>
        <div class="metric-card card-purple">
          <span class="metric-label">Total Monthly Hours</span>
          <span class="metric-value text-purple">{{ totalMonthlyHours.toFixed(1) }} hrs</span>
        </div>
      </div>

      <!-- Attendance History Log Table -->
      <div class="card history-card mt-4">
        <div class="card-header">
          <div class="header-left">
            <h2 class="card-title">📅 Attendance Logs & Absent Status (Last 5 Days)</h2>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Check-In Time</th>
                <th>Check-Out Time</th>
                <th>Total Hours</th>
                <th>Status</th>
                <th>Selfies</th>
                <th>Remarks / Reason</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of historyList" [class.row-absent]="item.status === 'ABSENT'">
                <td class="font-semibold">{{ item.attendanceDate }}</td>
                <td class="text-success font-medium">{{ item.inTime || '-' }}</td>
                <td class="text-danger font-medium">{{ item.outTime || '-' }}</td>
                <td>{{ item.totalHours ? item.totalHours + ' hrs' : '-' }}</td>
                <td>
                  <span class="badge" 
                        [class.badge-success]="item.status === 'PRESENT'" 
                        [class.badge-warning]="item.status === 'LATE'"
                        [class.badge-danger]="item.status === 'ABSENT'"
                        [class.badge-purple]="item.status === 'REGULARIZED'"
                        [class.badge-neutral]="item.status !== 'PRESENT' && item.status !== 'LATE' && item.status !== 'ABSENT' && item.status !== 'REGULARIZED'">
                    {{ item.status || 'PRESENT' }}
                  </span>
                </td>
                <td>
                  <div class="selfie-thumbs-row">
                    <img *ngIf="item.checkInSelfie" [src]="item.checkInSelfie" class="table-selfie-thumb" (click)="viewImageModal(item.checkInSelfie)" title="Check-In Selfie" alt="In Selfie" />
                    <img *ngIf="item.checkOutSelfie" [src]="item.checkOutSelfie" class="table-selfie-thumb" (click)="viewImageModal(item.checkOutSelfie)" title="Check-Out Selfie" alt="Out Selfie" />
                    <span *ngIf="!item.checkInSelfie && !item.checkOutSelfie" class="text-muted small">No Photo</span>
                  </div>
                </td>
                <td class="small text-muted">{{ item.remarks || '-' }}</td>
                <td>
                  <button *ngIf="item.status === 'ABSENT' || item.status === 'LATE' || (!item.outTime && item.status !== 'REGULARIZED')" 
                          class="btn btn-outline btn-xs" 
                          (click)="openRegularizationModal(item)">
                    ⏱️ Regularize
                  </button>
                  <span *ngIf="item.status === 'REGULARIZED'" class="text-purple font-semibold small">✓ Regularized</span>
                </td>
              </tr>
              <tr *ngIf="historyList.length === 0">
                <td colspan="8" class="text-center text-muted py-4">No attendance records found for selected month.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- Modal for viewing full selfie photo -->
    <div *ngIf="modalImageUrl" class="modal-backdrop" (click)="modalImageUrl = null">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <button class="modal-close" (click)="modalImageUrl = null">✕</button>
        <img [src]="modalImageUrl" class="modal-full-img" alt="Selfie Preview" />
      </div>
    </div>

    <!-- Modal for Attendance Regularization -->
    <div *ngIf="isRegModalOpen" class="modal-backdrop" (click)="isRegModalOpen = false">
      <div class="modal-content reg-modal-content" (click)="$event.stopPropagation()">
        <button class="modal-close" (click)="isRegModalOpen = false">✕</button>
        <h2 class="modal-title">⏱️ Request Attendance Regularization</h2>
        <p class="modal-subtitle">Submit missed check-in/check-out punch adjustment for date: <strong>{{ regItem?.attendanceDate }}</strong></p>

        <div class="form-group mt-3">
          <label class="form-label">Requested In Time</label>
          <input type="time" class="form-control" [(ngModel)]="regInTime" />
        </div>

        <div class="form-group mt-3">
          <label class="form-label">Requested Out Time</label>
          <input type="time" class="form-control" [(ngModel)]="regOutTime" />
        </div>

        <div class="form-group mt-3">
          <label class="form-label">Reason for Missed Punch / Regularization</label>
          <textarea class="form-control" rows="3" [(ngModel)]="regReason" placeholder="e.g. Forgot to punch out due to client meeting"></textarea>
        </div>

        <div class="modal-actions mt-4">
          <button class="btn btn-secondary" (click)="isRegModalOpen = false">Cancel</button>
          <button class="btn btn-primary" [disabled]="isSubmittingReg" (click)="submitRegularization()">
            Submit Regularization Request
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .attendance-container {
      padding: 1.5rem;
      max-width: 1300px;
      margin: 0 auto;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      background: #ffffff;
      padding: 1.25rem 1.5rem;
      border-radius: 14px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
      border: 1px solid #e2e8f0;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0.25rem 0 0 0;
    }

    .live-clock-card {
      text-align: right;
      background: linear-gradient(135deg, #891EA2 0%, #6b1482 100%);
      color: #ffffff;
      padding: 0.75rem 1.25rem;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(137, 30, 162, 0.25);
    }

    .clock-time {
      font-size: 1.4rem;
      font-weight: 800;
      letter-spacing: 1px;
      font-variant-numeric: tabular-nums;
    }

    .clock-date {
      font-size: 0.75rem;
      opacity: 0.9;
    }

    .attendance-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    @media (max-width: 992px) {
      .attendance-grid {
        grid-template-columns: 1fr;
      }
    }

    .card {
      background: #ffffff;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
      padding: 1.5rem;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #f1f5f9;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .card-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .header-filters {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .filter-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748b;
    }

    .select-control {
      padding: 0.35rem 0.65rem;
      font-size: 0.85rem;
      border-radius: 6px;
    }

    .pulse-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: #94a3b8;
    }

    .pulse-dot.active {
      background-color: #22c55e;
      box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.25);
    }

    .camera-viewport {
      position: relative;
      width: 100%;
      height: 320px;
      background: #0f172a;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      border: 2px solid #334155;
    }

    .webcam-video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .captured-preview-container {
      width: 100%;
      height: 100%;
      position: relative;
    }

    .captured-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .captured-overlay-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(0, 0, 0, 0.75);
      color: #22c55e;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      border: 1px solid #22c55e;
    }

    .camera-placeholder {
      text-align: center;
      color: #94a3b8;
      padding: 1.5rem;
    }

    .placeholder-icon {
      font-size: 3rem;
      margin-bottom: 0.5rem;
    }

    .placeholder-text {
      font-size: 0.9rem;
      margin-bottom: 1rem;
      color: #cbd5e1;
    }

    .hidden-canvas {
      display: none;
    }

    .hidden {
      display: none !important;
    }

    .camera-actions {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      padding: 0.6rem 1.2rem;
      font-size: 0.9rem;
      font-weight: 600;
      border-radius: 8px;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-xs {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }

    .btn-sm {
      padding: 0.4rem 0.8rem;
      font-size: 0.8rem;
    }

    .btn-lg {
      padding: 0.85rem 1.5rem;
      font-size: 1rem;
    }

    .btn-primary {
      background: #891EA2;
      color: #ffffff;
    }

    .btn-primary:hover {
      background: #731788;
    }

    .btn-secondary {
      background: #64748b;
      color: #ffffff;
    }

    .btn-success {
      background: #16a34a;
      color: #ffffff;
    }

    .btn-danger {
      background: #dc2626;
      color: #ffffff;
    }

    .btn-warning {
      background: #eab308;
      color: #0f172a;
    }

    .btn-outline {
      background: transparent;
      border-color: #cbd5e1;
      color: #475569;
    }

    .btn-outline:hover {
      background: #f8fafc;
    }

    .btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .file-upload-label {
      margin: 0;
      cursor: pointer;
    }

    .meta-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .form-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .btn-text-action {
      background: none;
      border: none;
      color: #891EA2;
      font-weight: 600;
      font-size: 0.8rem;
      cursor: pointer;
      padding: 0;
    }

    .form-control {
      padding: 0.65rem 0.85rem;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      font-size: 0.9rem;
      color: #0f172a;
      outline: none;
    }

    .form-control:focus {
      border-color: #891EA2;
      box-shadow: 0 0 0 3px rgba(137, 30, 162, 0.15);
    }

    .action-buttons-group {
      display: flex;
      gap: 1rem;
    }

    .flex-1 {
      flex: 1;
    }

    .right-column {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .status-summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .status-box {
      background: #f8fafc;
      padding: 1rem;
      border-radius: 10px;
      border: 1px solid #f1f5f9;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .status-box.full-width {
      grid-column: span 2;
    }

    .status-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
    }

    .status-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
    }

    .status-sub {
      font-size: 0.75rem;
      color: #64748b;
    }

    .highlight-in {
      color: #16a34a;
    }

    .highlight-out {
      color: #dc2626;
    }

    .selfie-previews-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .selfie-card {
      background: #f8fafc;
      border-radius: 10px;
      padding: 0.75rem;
      border: 1px solid #f1f5f9;
      text-align: center;
    }

    .selfie-title {
      font-size: 0.8rem;
      font-weight: 600;
      color: #475569;
      margin-bottom: 0.5rem;
    }

    .selfie-frame {
      width: 100%;
      height: 140px;
      border-radius: 8px;
      background: #e2e8f0;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .selfie-thumb {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .selfie-empty {
      font-size: 0.8rem;
      color: #94a3b8;
    }

    .guidelines-card {
      background: #faf5ff;
      border-color: #f3e8ff;
    }

    .guidelines-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #6b21a8;
      margin: 0 0 0.5rem 0;
    }

    .guidelines-list {
      margin: 0;
      padding-left: 1.2rem;
      font-size: 0.85rem;
      color: #581c87;

      li {
        margin-bottom: 0.35rem;
      }
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }

    .metric-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    }

    .metric-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }

    .metric-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.65rem;
      font-size: 0.75rem;
      font-weight: 800 !important;
      border-radius: 20px;
      text-transform: uppercase;
      color: #0f172a !important;
      font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
    }

    .badge-success { background: #dcfce7; color: #0f172a !important; border: 1px solid #86efac; }
    .badge-warning { background: #fef9c3; color: #0f172a !important; border: 1px solid #fde047; }
    .badge-danger  { background: #fee2e2; color: #0f172a !important; border: 1px solid #fca5a5; }
    .badge-purple  { background: #f3e8ff; color: #0f172a !important; border: 1px solid #d8b4fe; }
    .badge-neutral { background: #f1f5f9; color: #0f172a !important; border: 1px solid #cbd5e1; }

    .table-responsive {
      overflow-x: auto;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;
    }

    .table th {
      background: #f8fafc;
      padding: 0.75rem 1rem;
      font-weight: 600;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
    }

    .table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
      vertical-align: middle;
    }

    .row-absent {
      background: #fff5f5;
    }

    .selfie-thumbs-row {
      display: flex;
      gap: 0.4rem;
    }

    .table-selfie-thumb {
      width: 38px;
      height: 38px;
      border-radius: 6px;
      object-fit: cover;
      cursor: pointer;
      border: 1px solid #cbd5e1;
      transition: transform 0.15s ease;
    }

    .table-selfie-thumb:hover {
      transform: scale(1.15);
    }

    .mt-4 { margin-top: 1.5rem; }
    .mt-3 { margin-top: 0.85rem; }

    .text-success { color: #16a34a; }
    .text-danger  { color: #dc2626; }
    .text-warning { color: #d97706; }
    .text-purple  { color: #891EA2; }
    .text-muted   { color: #94a3b8; }
    .font-semibold { font-weight: 600; }
    .font-medium { font-weight: 500; }
    .small { font-size: 0.75rem; }

    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    .modal-content {
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .reg-modal-content {
      width: 480px;
      padding: 1.75rem;
    }

    .modal-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 0.25rem 0;
    }

    .modal-subtitle {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0;
    }

    .modal-close {
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(0,0,0,0.1);
      color: #0f172a;
      border: none;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-full-img {
      max-width: 100%;
      max-height: 80vh;
      display: block;
      object-fit: contain;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
  `]
})
export class MarkAttendanceComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  currentTimeStr: string = '';
  currentDateStr: string = '';
  private timerId: any;

  isCameraActive: boolean = false;
  capturedSelfie: string | null = null;
  mediaStream: MediaStream | null = null;

  locationText: string = 'Main Office - Unit 1';
  remarksText: string = '';
  isSubmitting: boolean = false;

  todayRecord: AttendanceRecord | null = null;
  historyList: AttendanceRecord[] = [];
  modalImageUrl: string | null = null;

  // Monthly Filter Controls
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  monthOptions = [
    { label: 'January', value: 1 }, { label: 'February', value: 2 },
    { label: 'March', value: 3 },   { label: 'April', value: 4 },
    { label: 'May', value: 5 },     { label: 'June', value: 6 },
    { label: 'July', value: 7 },    { label: 'August', value: 8 },
    { label: 'September', value: 9 }, { label: 'October', value: 10 },
    { label: 'November', value: 11 }, { label: 'December', value: 12 }
  ];

  // Metric Stats
  totalWorkdays: number = 0;
  presentCount: number = 0;
  lateCount: number = 0;
  absentCount: number = 0;
  totalMonthlyHours: number = 0;

  // Regularization Modal State
  isRegModalOpen: boolean = false;
  isSubmittingReg: boolean = false;
  regItem: AttendanceRecord | null = null;
  regInTime: string = '09:30';
  regOutTime: string = '18:30';
  regReason: string = '';

  constructor(
    private api: ApiService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.updateClock();
    this.timerId = setInterval(() => this.updateClock(), 1000);
    this.loadTodayAttendance();
    this.loadMonthlyLogs();
    this.startCamera();
  }

  ngOnDestroy(): void {
    if (this.timerId) clearInterval(this.timerId);
    this.stopCamera();
  }

  private updateClock(): void {
    const now = new Date();
    this.currentTimeStr = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.currentDateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  async startCamera(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      if (this.videoElement && this.videoElement.nativeElement) {
        this.videoElement.nativeElement.srcObject = this.mediaStream;
      }
      this.isCameraActive = true;
    } catch (err) {
      console.warn('Camera access could not be initialized:', err);
      this.isCameraActive = false;
      this.toast.info('Camera unavailable or permission denied. You can upload a photo manually.');
    }
  }

  stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.isCameraActive = false;
  }

  captureSnapshot(): void {
    if (!this.videoElement || !this.canvasElement) return;

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      this.capturedSelfie = canvas.toDataURL('image/png');
      this.stopCamera();
    }
  }

  retakePhoto(): void {
    this.capturedSelfie = null;
    this.startCamera();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.capturedSelfie = e.target.result;
        this.stopCamera();
      };
      reader.readAsDataURL(file);
    }
  }

  detectLocation(): void {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.locationText = `Lat: ${pos.coords.latitude.toFixed(4)}, Lon: ${pos.coords.longitude.toFixed(4)}`;
          this.toast.success('GPS Location auto-detected successfully!');
        },
        () => {
          this.toast.info('GPS detection unavailable. Using default work location.');
        }
      );
    } else {
      this.toast.info('Geolocation not supported by browser.');
    }
  }

  loadTodayAttendance(): void {
    this.api.get<AttendanceRecord>('/attendance/today').subscribe({
      next: (res: ApiResponse<AttendanceRecord>) => {
        if (res.success && res.data) {
          this.todayRecord = res.data;
        }
      },
      error: () => {}
    });
  }

  onFilterChange(): void {
    this.loadMonthlyLogs();
  }

  loadMonthlyLogs(): void {
    const params = `?days=5&month=${this.selectedMonth}&year=${this.selectedYear}`;
    this.api.post<AttendanceRecord[]>(`/attendance/my-logs${params}`, {}).subscribe({
      next: (res: ApiResponse<AttendanceRecord[]>) => {
        if (res.success && Array.isArray(res.data)) {
          // Keep only records from the last 5 days from today
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          
          const fiveDaysAgo = new Date();
          fiveDaysAgo.setDate(today.getDate() - 4);
          fiveDaysAgo.setHours(0, 0, 0, 0);

          const filtered = res.data.filter(item => {
            if (!item.attendanceDate) return false;
            const itemDate = new Date(item.attendanceDate);
            return itemDate >= fiveDaysAgo && itemDate <= today;
          });

          this.historyList = filtered.length > 0 ? filtered.slice(0, 5) : res.data.slice(0, 5);
          this.calculateMetrics();
        }
      },
      error: () => {}
    });
  }

  calculateMetrics(): void {
    this.totalWorkdays = this.historyList.length;
    this.presentCount = this.historyList.filter(item => item.status === 'PRESENT' || item.status === 'REGULARIZED').length;
    this.lateCount = this.historyList.filter(item => item.status === 'LATE').length;
    this.absentCount = this.historyList.filter(item => item.status === 'ABSENT').length;
    
    this.totalMonthlyHours = this.historyList.reduce((sum, item) => sum + (item.totalHours || 0), 0);
  }

  submitAttendance(type: 'check-in' | 'check-out'): void {
    if (!this.capturedSelfie && !this.todayRecord?.inTime) {
      this.toast.error('Please capture or upload a selfie snapshot first!');
      return;
    }

    this.isSubmitting = true;
    const payload = {
      selfieImage: this.capturedSelfie,
      location: this.locationText,
      remarks: this.remarksText
    };

    const endpoint = type === 'check-in' ? '/attendance/check-in' : '/attendance/check-out';

    this.api.post<AttendanceRecord>(endpoint, payload).subscribe({
      next: (res: ApiResponse<AttendanceRecord>) => {
        this.isSubmitting = false;
        if (res.success) {
          this.toast.success(res.message || `${type === 'check-in' ? 'Check-In' : 'Check-Out'} successful!`);
          this.todayRecord = res.data;
          this.capturedSelfie = null;
          this.remarksText = '';
          this.loadMonthlyLogs();
          this.startCamera();
        } else {
          this.toast.error(res.message || 'Action failed.');
        }
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }

  openRegularizationModal(item: AttendanceRecord): void {
    this.regItem = item;
    this.regInTime = item.inTime || '09:30';
    this.regOutTime = item.outTime || '18:30';
    this.regReason = '';
    this.isRegModalOpen = true;
  }

  submitRegularization(): void {
    if (!this.regItem) return;

    this.isSubmittingReg = true;
    const payload = {
      attendanceId: this.regItem.id || null,
      attendanceDate: this.regItem.attendanceDate,
      inTime: this.regInTime,
      outTime: this.regOutTime,
      reason: this.regReason
    };

    this.api.post<AttendanceRecord>('/attendance/regularize', payload).subscribe({
      next: (res: ApiResponse<AttendanceRecord>) => {
        this.isSubmittingReg = false;
        if (res.success) {
          this.toast.success(res.message || 'Regularization request processed successfully!');
          this.isRegModalOpen = false;
          this.loadMonthlyLogs();
        } else {
          this.toast.error(res.message || 'Regularization failed.');
        }
      },
      error: (err) => {
        this.isSubmittingReg = false;
        if (err?.error?.message) {
          this.toast.error(err.error.message);
        }
      }
    });
  }

  viewImageModal(url: string): void {
    this.modalImageUrl = url;
  }
}
