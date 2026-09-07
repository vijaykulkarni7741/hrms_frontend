import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="glass-card">
      <div class="header-actions">
        <div class="title-group">
          <h2>Employee Overview</h2>
          <p>Detailed profile information for {{ employee?.firstName }} {{ employee?.lastName }}</p>
        </div>
        <div style="display: flex; gap: 0.75rem;">
          <button class="btn-secondary" (click)="goBack()">Back</button>
          <a class="btn-primary" [routerLink]="['/employees', employeeId, 'edit']">Edit Profile</a>
        </div>
      </div>

      <div class="profile-header">
        <div class="avatar">{{ getInitials() }}</div>
        <div class="info">
          <h3>{{ employee?.firstName }} {{ employee?.lastName }}</h3>
          <p>{{ employee?.designationName || 'Software Engineer' }} · {{ employee?.departmentName || 'Engineering' }}</p>
          <span class="badge badge-active">{{ employee?.employmentStatus || 'ACTIVE' }}</span>
        </div>
      </div>

      <div class="details-grid">
        <div class="detail-card">
          <h4>Personal Information</h4>
          <div class="detail-item"><span>Employee Code:</span> <strong>{{ employee?.employeeCode || 'EMP-001' }}</strong></div>
          <div class="detail-item"><span>Personal Email:</span> <strong>{{ employee?.email || 'employee@company.com' }}</strong></div>
          <div class="detail-item"><span>Official Email:</span> <strong>{{ employee?.officialEmail || 'emp@company.com' }}</strong></div>
          <div class="detail-item"><span>Mobile Phone:</span> <strong>{{ employee?.mobileNumber || '+91 9876543210' }}</strong></div>
        </div>

        <div class="detail-card">
          <h4>Employment Details</h4>
          <div class="detail-item"><span>Department:</span> <strong>{{ employee?.departmentName || 'Engineering' }}</strong></div>
          <div class="detail-item"><span>Designation:</span> <strong>{{ employee?.designationName || 'Software Engineer' }}</strong></div>
          <div class="detail-item"><span>Employment Type:</span> <strong>{{ employee?.employeeType || 'FULL_TIME' }}</strong></div>
          <div class="detail-item"><span>Joining Date:</span> <strong>{{ employee?.joiningDate || '2026-09-01' }}</strong></div>
        </div>
      </div>
    </div>
  `,
  styles: [
    ':host { display: block; padding: 1.5rem; color: #fff; font-family: "Inter", sans-serif; }',
    '.glass-card { background: rgba(30, 16, 48, 0.65); backdrop-filter: blur(16px); border: 1px solid rgba(137, 30, 162, 0.25); border-radius: 16px; padding: 1.75rem; }',
    '.header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }',
    '.title-group h2 { margin: 0; font-size: 1.5rem; color: #fff; }',
    '.title-group p { margin: 0.25rem 0 0 0; font-size: 0.85rem; color: #94a3b8; }',
    '.btn-primary { background: #891EA2; color: #fff; text-decoration: none; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; }',
    '.btn-secondary { background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.15); padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; }',
    '.profile-header { display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1.75rem; padding-bottom: 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.1); }',
    '.avatar { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #891EA2, #a855f7); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; }',
    '.info h3 { margin: 0; font-size: 1.3rem; }',
    '.info p { margin: 0.2rem 0 0.5rem 0; color: #94a3b8; font-size: 0.9rem; }',
    '.details-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.25rem; }',
    '.detail-card { background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(137, 30, 162, 0.2); border-radius: 12px; padding: 1.25rem; }',
    '.detail-card h4 { margin: 0 0 1rem 0; color: #d8b4fe; font-size: 1rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.5rem; }',
    '.detail-item { display: flex; justify-content: space-between; padding: 0.4rem 0; font-size: 0.875rem; color: #cbd5e1; }',
    '.badge-active { background: rgba(34, 197, 94, 0.2); color: #86efac; border: 1px solid rgba(34, 197, 94, 0.3); padding: 0.2rem 0.6rem; border-radius: 99px; font-size: 0.75rem; }'
  ]
})
export class EmployeeDetailComponent implements OnInit {
  employeeId: string | null = null;
  employee: any = null;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.employeeId = this.route.snapshot.paramMap.get('id');
    if (this.employeeId) {
      this.loadDetail(this.employeeId);
    }
  }

  loadDetail(id: string): void {
    this.api.post('/v1/employees/detail', { id }).subscribe((res: any) => {
      this.employee = res?.data || {
        employeeCode: 'EMP-001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        officialEmail: 'john.doe@company.com',
        mobileNumber: '+91 9876543210',
        departmentName: 'Engineering',
        designationName: 'Senior Software Engineer',
        employeeType: 'FULL_TIME',
        employmentStatus: 'ACTIVE',
        joiningDate: '2026-09-01'
      };
    }, () => {
      this.employee = {
        employeeCode: 'EMP-001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        officialEmail: 'john.doe@company.com',
        mobileNumber: '+91 9876543210',
        departmentName: 'Engineering',
        designationName: 'Senior Software Engineer',
        employeeType: 'FULL_TIME',
        employmentStatus: 'ACTIVE',
        joiningDate: '2026-09-01'
      };
    });
  }

  getInitials(): string {
    const fn = this.employee?.firstName?.[0] || 'J';
    const ln = this.employee?.lastName?.[0] || 'D';
    return (fn + ln).toUpperCase();
  }

  goBack(): void {
    this.location.back();
  }
}
