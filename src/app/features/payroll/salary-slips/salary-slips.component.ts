import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from 'src/app/services/api.service';
import { ToastService } from 'src/app/core/services/toast.service';

interface SalarySlip {
  id: number;
  employee: { id: number; firstName: string; lastName: string; employeeCode: string };
  payroll: { id: number; payrollMonth: number; payrollYear: number };
  slipNumber: string; netSalary: number; pdfUrl: string; status: string; generatedDate: string;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

@Component({
  selector: 'app-salary-slips',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2 class="page-title">🧾 Salary Slips</h2>
          <p class="page-subtitle">View and download salary slips</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <div class="search-box form-group" style="margin-bottom:0;flex:1;">
          <span class="search-icon">🔍</span>
          <input class="form-control" placeholder="Search employee name or code…" [(ngModel)]="search" (ngModelChange)="applyFilter()" id="slip-search" />
        </div>
        <select class="form-control" style="width:130px;" [(ngModel)]="filterMonth" (ngModelChange)="applyFilter()" id="slip-month">
          <option value="">All Months</option>
          @for (m of MONTHS; track m; let i = $index) {
            <option [value]="i+1">{{ m }}</option>
          }
        </select>
        <input type="number" class="form-control" style="width:100px;" [(ngModel)]="filterYear" (ngModelChange)="applyFilter()" placeholder="Year" id="slip-year" min="2000" max="2100" />
        <select class="form-control" style="width:140px;" [(ngModel)]="filterStatus" (ngModelChange)="applyFilter()" id="slip-status">
          <option value="">All Status</option><option>GENERATED</option><option>PAID</option><option>CANCELLED</option>
        </select>
      </div>

      <div class="card" style="padding:0; overflow:hidden;">
        @if (isLoading()) {
          <div class="flex-center" style="padding:60px;"><div class="spinner spinner-lg"></div></div>
        } @else if (filtered().length === 0) {
          <div class="empty-state"><div class="empty-icon">🧾</div><h3>No salary slips found</h3></div>
        } @else {
          <div class="table-wrapper">
            <table>
              <thead><tr>
                <th>Employee</th><th>Slip #</th><th>Month/Year</th>
                <th>Net Salary</th><th>Generated On</th><th>Status</th><th>Actions</th>
              </tr></thead>
              <tbody>
                @for (s of filtered(); track s.id) {
                  <tr>
                    <td>
                      <div style="font-weight:600;">{{ s.employee.firstName }} {{ s.employee.lastName }}</div>
                      <div style="font-size:0.75rem;color:var(--text-muted);">{{ s.employee.employeeCode }}</div>
                    </td>
                    <td><code style="background:var(--bg-input);padding:2px 6px;border-radius:4px;font-size:0.78rem;">{{ s.slipNumber }}</code></td>
                    <td>{{ monthName(s.payroll?.payrollMonth) }} {{ s.payroll?.payrollYear }}</td>
                    <td><strong style="color:var(--success);">₹{{ formatAmount(s.netSalary) }}</strong></td>
                    <td>{{ fmt(s.generatedDate) }}</td>
                    <td><span class="badge" [class]="slipBadge(s.status)">{{ s.status }}</span></td>
                    <td>
                      <div style="display:flex;gap:6px;">
                        @if (s.pdfUrl) {
                          <a class="btn btn-secondary btn-sm" [href]="s.pdfUrl" target="_blank" [id]="'download-slip-'+s.id" title="Download PDF">📥 PDF</a>
                        }
                        <button class="btn btn-secondary btn-sm btn-icon" (click)="viewSlip(s)" [id]="'view-slip-'+s.id" title="View">👁️</button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>

    <!-- View Slip Modal -->
    @if (selectedSlip()) {
      <div class="overlay" (click)="selectedSlip.set(null)">
        <div class="modal" (click)="$event.stopPropagation()" style="max-width:600px;">
          <div class="modal-header">
            <h3 class="modal-title">🧾 Salary Slip Details</h3>
            <span class="cursor-pointer" (click)="selectedSlip.set(null)" id="close-slip-modal">✕</span>
          </div>
          <div style="background:var(--bg-input);border-radius:var(--border-radius);padding:20px;margin-bottom:20px;">
            <div style="text-align:center;margin-bottom:20px;border-bottom:1px solid var(--border);padding-bottom:16px;">
              <div style="font-size:1.2rem;font-weight:700;color:var(--primary-light);">SALARY SLIP</div>
              <div style="color:var(--text-muted);font-size:0.85rem;">{{ monthName(selectedSlip()?.payroll?.payrollMonth) }} {{ selectedSlip()?.payroll?.payrollYear }}</div>
            </div>
            <div class="grid grid-2" style="gap:12px;">
              <div>
                <div class="form-label">Employee Name</div>
                <div style="font-weight:600;">{{ selectedSlip()?.employee?.firstName }} {{ selectedSlip()?.employee?.lastName }}</div>
              </div>
              <div>
                <div class="form-label">Employee Code</div>
                <div style="font-weight:600;">{{ selectedSlip()?.employee?.employeeCode }}</div>
              </div>
              <div>
                <div class="form-label">Slip Number</div>
                <div style="font-weight:600;">{{ selectedSlip()?.slipNumber }}</div>
              </div>
              <div>
                <div class="form-label">Status</div>
                <span class="badge" [class]="slipBadge(selectedSlip()?.status || '')">{{ selectedSlip()?.status }}</span>
              </div>
            </div>
            <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);text-align:center;">
              <div class="form-label">Net Salary</div>
              <div style="font-size:2rem;font-weight:800;color:var(--success);">₹{{ formatAmount(selectedSlip()?.netSalary || 0) }}</div>
            </div>
          </div>
          <div class="modal-footer">
            @if (selectedSlip()?.pdfUrl) {
              <a class="btn btn-primary" [href]="selectedSlip()?.pdfUrl" target="_blank" id="modal-download-btn">📥 Download PDF</a>
            }
            <button class="btn btn-secondary" (click)="selectedSlip.set(null)" id="close-slip-detail-btn">Close</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class SalarySlipsComponent implements OnInit {
  private api = inject(ApiService);
  MONTHS = MONTHS;

  slips      = signal<SalarySlip[]>([]);
  filtered   = signal<SalarySlip[]>([]);
  isLoading  = signal(true);
  selectedSlip = signal<SalarySlip | null>(null);
  search = ''; filterMonth: number | '' = ''; filterYear: number | '' = ''; filterStatus = '';

  ngOnInit() { this.load(); }

  load() {
    this.isLoading.set(true);
    this.api.post<SalarySlip[]>('/v1/salary-slips/list', {}).subscribe({
      next: (r: any) => { this.slips.set(r.data ?? []); this.applyFilter(); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  applyFilter() {
    let list = this.slips();
    if (this.search) {
      const q = this.search.toLowerCase();
      list = list.filter(s => `${s.employee.firstName} ${s.employee.lastName}`.toLowerCase().includes(q) || s.employee.employeeCode.includes(q));
    }
    if (this.filterMonth) list = list.filter(s => s.payroll?.payrollMonth === +this.filterMonth);
    if (this.filterYear)  list = list.filter(s => s.payroll?.payrollYear  === +this.filterYear);
    if (this.filterStatus) list = list.filter(s => s.status === this.filterStatus);
    this.filtered.set(list);
  }

  viewSlip(s: SalarySlip) { this.selectedSlip.set(s); }
  monthName(m?: number)   { return m ? MONTHS[m-1] : '—'; }
  formatAmount(n: number) { return n ? n.toLocaleString('en-IN') : '0'; }
  fmt(d: string)          { return d ? new Date(d).toLocaleDateString('en-IN') : '—'; }
  slipBadge(s: string)    {
    const m: Record<string,string> = { GENERATED:'badge-info', PAID:'badge-success', CANCELLED:'badge-danger' };
    return m[s] ?? 'badge-info';
  }
}
