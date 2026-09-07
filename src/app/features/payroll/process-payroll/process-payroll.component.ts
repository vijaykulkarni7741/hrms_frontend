import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';
import { HasPermissionDirective } from 'src/app/core/directives/has-permission.directive';

@Component({
  selector: 'app-process-payroll',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HasPermissionDirective],
  template: `
    <div class="glass-card" style="max-width: 800px; margin: 0 auto;">
      <div class="header-actions">
        <div class="title-group">
          <h2>Process Monthly Payroll</h2>
          <p>Run and calculate monthly salary disbursement</p>
        </div>
        <button class="btn-secondary" (click)="goBack()">Back</button>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="form-grid">
          
          <div class="form-group">
            <label for="payrollMonth">Payroll Month</label>
            
            <select id="payrollMonth" formControlName="payrollMonth" class="form-control">
              <option value="January">January</option><option value="February">February</option><option value="March">March</option><option value="April">April</option><option value="May">May</option><option value="June">June</option><option value="July">July</option><option value="August">August</option><option value="September">September</option><option value="October">October</option><option value="November">November</option><option value="December">December</option>
            </select>
          </div>
          <div class="form-group">
            <label for="payrollYear">Year</label>
            
            <select id="payrollYear" formControlName="payrollYear" class="form-control">
              <option value="2026">2026</option><option value="2025">2025</option>
            </select>
          </div>
          <div class="form-group">
            <label for="departmentName">Department</label>
            
            <select id="departmentName" formControlName="departmentName" class="form-control">
              <option value="ALL">ALL</option><option value="Engineering">Engineering</option><option value="HR">HR</option><option value="Sales">Sales</option><option value="Finance">Finance</option>
            </select>
          </div>
          <div class="form-group">
            <label for="processStatus">Process Action</label>
            
            <select id="processStatus" formControlName="processStatus" class="form-control">
              <option value="CALCULATE_DRAFT">CALCULATE_DRAFT</option><option value="FINALIZE_AND_DISBURSE">FINALIZE_AND_DISBURSE</option>
            </select>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
          <button type="button" class="btn-secondary" (click)="goBack()">Cancel</button>
          <button *hasPermission="'PAYROLL_EXECUTE'" type="submit" class="btn-primary" [disabled]="form.invalid">Submit Request</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
  :host {
    display: block;
    padding: 1.5rem;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: #f8fafc;
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
  .btn-danger {
    background: rgba(239, 68, 68, 0.2);
    color: #fca5a5;
    border: 1px solid rgba(239, 68, 68, 0.3);
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .btn-danger:hover {
    background: rgba(239, 68, 68, 0.4);
  }
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
    max-width: 320px;
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
  .badge {
    padding: 0.25rem 0.6rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    display: inline-block;
  }
  .badge-active { background: rgba(34, 197, 94, 0.2); color: #86efac; border: 1px solid rgba(34, 197, 94, 0.3); }
  .badge-inactive { background: rgba(148, 163, 184, 0.2); color: #cbd5e1; border: 1px solid rgba(148, 163, 184, 0.3); }
  .badge-pending { background: rgba(234, 179, 8, 0.2); color: #fde047; border: 1px solid rgba(234, 179, 8, 0.3); }
  .badge-approved { background: rgba(59, 130, 246, 0.2); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.3); }
  .badge-rejected { background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.3); }
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
    max-width: 580px;
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
    font-size: 1.25rem;
    color: #ffffff;
  }
  .close-btn {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 1.25rem;
    cursor: pointer;
  }
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
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
    text-transform: capitalize;
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
  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #94a3b8;
  }
`]
})
export class ProcessPayrollComponent implements OnInit {
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      payrollMonth: ['', Validators.required],
      payrollYear: ['', Validators.required],
      departmentName: ['', Validators.required],
      processStatus: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.api.post('/v1/payroll/process/save', this.form.value).subscribe(() => {
      this.goBack();
    }, () => {
      this.goBack();
    });
  }

  goBack(): void {
    this.location.back();
  }
}
