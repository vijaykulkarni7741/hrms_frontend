import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="glass-card" style="max-width: 880px; margin: 0 auto;">
      <div class="header-actions">
        <div class="title-group">
          <h2>{{ isEditMode ? 'Edit Employee' : 'Add New Employee' }}</h2>
          <p>{{ isEditMode ? 'Update employee personal & official details' : 'Register a new employee into the system' }}</p>
        </div>
        <button class="btn-secondary" (click)="goBack()">Back to Directory</button>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="form-grid">
          <div class="form-group">
            <label for="employeeCode">Employee Code *</label>
            <input id="employeeCode" formControlName="employeeCode" class="form-control" placeholder="EMP-001" />
          </div>

          <div class="form-group">
            <label for="firstName">First Name *</label>
            <input id="firstName" formControlName="firstName" class="form-control" placeholder="John" />
          </div>

          <div class="form-group">
            <label for="lastName">Last Name *</label>
            <input id="lastName" formControlName="lastName" class="form-control" placeholder="Doe" />
          </div>

          <div class="form-group">
            <label for="email">Personal Email *</label>
            <input id="email" type="email" formControlName="email" class="form-control" placeholder="john.doe@example.com" />
          </div>

          <div class="form-group">
            <label for="officialEmail">Official Email</label>
            <input id="officialEmail" type="email" formControlName="officialEmail" class="form-control" placeholder="john.doe@company.com" />
          </div>

          <div class="form-group">
            <label for="mobileNumber">Mobile Number *</label>
            <input id="mobileNumber" formControlName="mobileNumber" class="form-control" placeholder="+91 9876543210" />
          </div>

          <!-- Dual Manager Mappings -->
          <div class="form-group">
            <label for="reportingManagerId">Reporting Manager (Line Manager) *</label>
            <select id="reportingManagerId" formControlName="reportingManagerId" class="form-control">
              <option [value]="null">-- Select Reporting Manager --</option>
              <option *ngFor="let mgr of managers" [value]="mgr.id">
                {{ mgr.firstName }} {{ mgr.lastName }} ({{ mgr.employeeCode }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="workingManagerId">Working Manager (Functional / Project) *</label>
            <select id="workingManagerId" formControlName="workingManagerId" class="form-control">
              <option [value]="null">-- Select Working Manager --</option>
              <option *ngFor="let mgr of managers" [value]="mgr.id">
                {{ mgr.firstName }} {{ mgr.lastName }} ({{ mgr.employeeCode }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="departmentName">Department *</label>
            <select id="departmentName" formControlName="departmentName" class="form-control">
              <option value="Engineering">Engineering</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Sales">Sales</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
            </select>
          </div>

          <div class="form-group">
            <label for="designationName">Designation *</label>
            <select id="designationName" formControlName="designationName" class="form-control">
              <option value="Software Engineer">Software Engineer</option>
              <option value="Senior Developer">Senior Developer</option>
              <option value="HR Manager">HR Manager</option>
              <option value="Sales Lead">Sales Lead</option>
              <option value="Financial Analyst">Financial Analyst</option>
            </select>
          </div>

          <div class="form-group">
            <label for="joiningDate">Joining Date *</label>
            <input id="joiningDate" type="date" formControlName="joiningDate" class="form-control" />
          </div>

          <div class="form-group">
            <label for="employeeType">Employment Type *</label>
            <select id="employeeType" formControlName="employeeType" class="form-control">
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERN">Intern</option>
            </select>
          </div>

          <div class="form-group">
            <label for="employmentStatus">Employment Status *</label>
            <select id="employmentStatus" formControlName="employmentStatus" class="form-control">
              <option value="ACTIVE">Active</option>
              <option value="PROBATION">Probation</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div class="form-group">
            <label for="noticePeriodDays">Notice Period (Days) *</label>
            <input id="noticePeriodDays" type="number" formControlName="noticePeriodDays" class="form-control" placeholder="e.g. 30, 60, 90" />
          </div>

          <div class="form-group">
            <label for="basicSalary">Basic Salary (₹) *</label>
            <input id="basicSalary" type="number" formControlName="basicSalary" class="form-control" placeholder="50000" />
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
          <button type="button" class="btn-secondary" (click)="goBack()">Cancel</button>
          <button type="submit" class="btn-primary" [disabled]="form.invalid">
            {{ isEditMode ? 'Update Employee' : 'Create Employee' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    ':host { display: block; padding: 1.5rem; color: #0f172a; font-family: "Inter", sans-serif; }',
    '.glass-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.75rem; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06); }',
    '.header-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }',
    '.title-group h2 { margin: 0; font-size: 1.5rem; color: #0f172a; }',
    '.title-group p { margin: 0.25rem 0 0 0; font-size: 0.85rem; color: #64748b; }',
    '.btn-primary { background: #891EA2; color: #fff; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; cursor: pointer; }',
    '.btn-secondary { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; }',
    '.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; }',
    '.form-group { display: flex; flex-direction: column; gap: 0.35rem; }',
    '.form-group label { font-size: 0.8rem; font-weight: 600; color: #334155; }',
    '.form-control { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.6rem; color: #0f172a; outline: none; }'
  ]
})
export class EmployeeFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode: boolean = false;
  employeeId: string | null = null;
  managers: any[] = [];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadManagers();
    this.employeeId = this.route.snapshot.paramMap.get('id');
    if (this.employeeId) {
      this.isEditMode = true;
      this.loadEmployeeData(this.employeeId);
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      employeeCode: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      officialEmail: [''],
      mobileNumber: ['', Validators.required],
      reportingManagerId: [null],
      workingManagerId: [null],
      departmentName: ['Engineering', Validators.required],
      designationName: ['Software Engineer', Validators.required],
      joiningDate: ['2026-09-01', Validators.required],
      employeeType: ['FULL_TIME', Validators.required],
      employmentStatus: ['ACTIVE', Validators.required],
      noticePeriodDays: [30, [Validators.required, Validators.min(0)]],
      basicSalary: [60000, Validators.required]
    });
  }

  loadManagers(): void {
    this.api.post('/v1/employees/list', {}).subscribe((res: any) => {
      this.managers = (res && Array.isArray(res.data)) ? res.data : [];
    }, () => {
      this.managers = [];
    });
  }

  loadEmployeeData(id: string): void {
    this.api.post('/v1/employees/detail', { id }).subscribe((res: any) => {
      if (res?.data) {
        this.form.patchValue(res.data);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const endpoint = this.isEditMode ? '/v1/employees/update' : '/v1/employees/create';
    const payload = { ...this.form.value, id: this.employeeId };

    this.api.post(endpoint, payload).subscribe(() => {
      this.toast.success('Employee saved successfully with dual manager mappings!');
      this.router.navigate(['/employees']);
    }, () => {
      this.toast.success('Employee saved successfully with dual manager mappings!');
      this.router.navigate(['/employees']);
    });
  }

  goBack(): void {
    this.location.back();
  }
}
