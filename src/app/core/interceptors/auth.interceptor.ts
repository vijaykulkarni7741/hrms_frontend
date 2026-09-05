import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler,
  HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthStateService } from '../state/auth-state.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authState: AuthStateService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token     = this.authState.token();
    const sessionId = this.authState.sessionId();

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    // Don't set Content-Type for FormData (browser sets multipart boundary)
    if (!(req.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (sessionId) {
      headers['X-Session-ID'] = sessionId;
    }

    const cloned = req.clone({ setHeaders: headers });

    return next.handle(cloned).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authState.logout();
        }
        return throwError(() => error);
      })
    );
  }
}
