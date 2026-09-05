import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {

  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private readonly ICONS: Record<ToastType, string> = {
    success: '✅',
    error:   '❌',
    warning: '⚠️',
    info:    'ℹ️',
  };

  show(message: string, type: ToastType = 'info', duration = 4000): void {
    const id = `toast_${Date.now()}_${Math.random()}`;
    const toast: Toast = { id, type, message, duration };
    this._toasts.update(list => [...list, toast]);

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  success(message: string, duration = 4000): void { this.show(message, 'success', duration); }
  error  (message: string, duration = 5000): void { this.show(message, 'error',   duration); }
  warning(message: string, duration = 4000): void { this.show(message, 'warning', duration); }
  info   (message: string, duration = 3500): void { this.show(message, 'info',    duration); }

  dismiss(id: string): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  getIcon(type: ToastType): string {
    return this.ICONS[type];
  }
}
