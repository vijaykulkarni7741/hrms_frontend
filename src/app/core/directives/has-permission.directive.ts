import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { AuthStateService } from '../state/auth-state.service';

/**
 * Structural Directive to conditionally render buttons, tabs, and actions
 * based on full dynamic module/submodule/button permissions, role matrix, and user overrides.
 *
 * Example usage:
 * <button *hasPermission="'ROSTER_CREATE'">+ Create Roster</button>
 * <button *hasPermission="['POLICY_APPROVE', 'POLICY_REJECT']">Approve / Reject</button>
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private authState = inject(AuthStateService);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private isCreated = false;

  @Input() set hasPermission(permission: string | string[] | undefined | null) {
    this.updateView(permission);
  }

  private updateView(permission: string | string[] | undefined | null): void {
    if (!permission) {
      this.show();
      return;
    }

    const hasAccess = this.checkPermission(permission);
    if (hasAccess) {
      this.show();
    } else {
      this.hide();
    }
  }

  private checkPermission(permission: string | string[]): boolean {
    if (Array.isArray(permission)) {
      return permission.some(p => this.authState.hasPermission(p));
    }
    return this.authState.hasPermission(permission);
  }

  private show(): void {
    if (!this.isCreated) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isCreated = true;
    }
  }

  private hide(): void {
    if (this.isCreated) {
      this.viewContainer.clear();
      this.isCreated = false;
    }
  }
}
