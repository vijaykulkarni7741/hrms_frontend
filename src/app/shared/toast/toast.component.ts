import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast {{ toast.type }}" [attr.data-id]="toast.id">
          <span class="toast-icon">{{ toastService.getIcon(toast.type) }}</span>
          <span class="toast-msg">{{ toast.message }}</span>
          <span class="toast-close" (click)="toastService.dismiss(toast.id)">✕</span>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  toastService = inject(ToastService);
}
