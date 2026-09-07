import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  post<T = any>(url: string, body: any = {}): Observable<T> {
    const fullUrl = this.formatUrl(url);
    let payload = body || {};
    if (typeof url === 'string' && (url.includes('/list') || url.includes('/get-all'))) {
      payload = {
        page: payload.page !== undefined ? payload.page : 0,
        size: payload.size !== undefined ? payload.size : 10,
        ...payload
      };
    }
    return this.http.post<T>(fullUrl, payload);
  }

  private formatUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    let path = url.startsWith('/') ? url : '/' + url;
    if (path.startsWith('/v1/')) {
      path = '/api' + path;
    } else if (!path.startsWith('/api')) {
      path = '/api/v1' + path;
    }
    return `${this.baseUrl}${path}`;
  }
}
