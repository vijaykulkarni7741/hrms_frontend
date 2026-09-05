import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ToastService } from './toast.service';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

export interface PagedResponse<T = any> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/**
 * Central API Service — ALL HTTP calls go through here.
 * Components only pass a url + body, errors are handled centrally.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {

  private readonly baseUrl = environment.apiBaseUrl;

  constructor(
    private http: HttpClient,
    private toast: ToastService,
  ) {}

  // ── GET ──────────────────────────────────────────────────────
  get<T>(url: string, params?: Record<string, any>): Observable<ApiResponse<T>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          httpParams = httpParams.set(k, String(v));
        }
      });
    }
    return this.http.get<ApiResponse<T>>(this._url(url), { params: httpParams })
      .pipe(catchError(err => this._handleError(err)));
  }

  // ── POST ─────────────────────────────────────────────────────
  post<T>(url: string, body: any = {}): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(this._url(url), body)
      .pipe(catchError(err => this._handleError(err)));
  }

  // ── PUT ──────────────────────────────────────────────────────
  put<T>(url: string, body: any = {}): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(this._url(url), body)
      .pipe(catchError(err => this._handleError(err)));
  }

  // ── PATCH ────────────────────────────────────────────────────
  patch<T>(url: string, body: any = {}): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(this._url(url), body)
      .pipe(catchError(err => this._handleError(err)));
  }

  // ── DELETE ───────────────────────────────────────────────────
  delete<T>(url: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(this._url(url))
      .pipe(catchError(err => this._handleError(err)));
  }

  // ── File Upload ───────────────────────────────────────────────
  upload<T>(url: string, formData: FormData): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(this._url(url), formData)
      .pipe(catchError(err => this._handleError(err)));
  }

  // ── Download ──────────────────────────────────────────────────
  download(url: string): Observable<Blob> {
    return this.http.get(this._url(url), { responseType: 'blob' })
      .pipe(catchError(err => this._handleError(err)));
  }

  // ── Private ──────────────────────────────────────────────────
  private _url(path: string): string {
    return path.startsWith('http') ? path : `${this.baseUrl}${path}`;
  }

  private _handleError(error: any): Observable<never> {
    let message = 'Something went wrong. Please try again.';

    try {
      if (error?.error?.message) {
        message = error.error.message;
      } else if (error?.message) {
        message = error.message;
      }

      switch (error?.status) {
        case 400: message = error?.error?.message ?? 'Invalid request data.';      break;
        case 401: message = 'Session expired. Please login again.';                break;
        case 403: message = 'You do not have permission to perform this action.';  break;
        case 404: message = 'The requested resource was not found.';               break;
        case 409: message = error?.error?.message ?? 'Conflict — record already exists.'; break;
        case 500: message = 'Server error. Please contact support.';               break;
        case 0:   message = 'Cannot connect to server. Check your network.';       break;
      }
    } catch { /* use default */ }

    this.toast.error(message);
    return throwError(() => error);
  }
}
