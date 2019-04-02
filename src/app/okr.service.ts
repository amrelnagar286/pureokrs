import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { AuthenticationService } from './authentication.service';
import { Okr, KeyResult } from './okr/okr';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class OkrService {

  private okrsUrl = '/api/okr';

  constructor(
    private http: HttpClient,
    private auth: AuthenticationService
  ) { }

  /**GET OKRs from the server */
  getOkrs(): Observable<Okr[]> {
    return this.http.get<Okr[]>(`${this.okrsUrl}/all`)
      .pipe(
        tap(_ => console.log('fetched okrs')),
        catchError(this.handleError('getOkrs', []))
      );
  }

  /**GET Key Results for a given OKR */
  getKeyResults(okrId: string): Observable<{ KeyResult }> {
    return this.http.get<{ KeyResult }>(`${this.okrsUrl}/keyresults/${okrId}`,
      {
        headers: {
          Authorization: `Bearer ${this.auth.getToken()}`
        }
      }).pipe(
        tap((krs: { KeyResult }) => console.log(`retrieved key results for OKR with id=${okrId}`)),
        catchError(this.handleError<{ KeyResult }>('getCompanyOKRs'))
      );
  }

  /**GET all OKRs for a given company name */
  getCompanyOkrs(company: string): Observable<{ Okr }> {
    return this.http.get<{ Okr }>(`${this.okrsUrl}/company/${company}`,
      {
        headers: {
          Authorization: `Bearer ${this.auth.getToken()}`
        }
      }).pipe(
        tap((okrs: { Okr }) => console.log(`retrieved all OKRs for ${company}`)),
        catchError(this.handleError<{ Okr }>('getCompanyOKRs'))
      );
  }

  /**GET OKR by id. Return undefined when id not found */
  getOkrNo404<Data>(id: string): Observable<Okr> {
    const url = `${this.okrsUrl}/?id=${id}`;
    return this.http.get<Okr[]>(url)
      .pipe(
        map(okrs => okrs[0]), //returns a {0|1} element array
        tap(o => {
          const outcome = o ? `fetched` : `did not find`;
          console.log(`${outcome} okr id=${id}`);
        }),
        catchError(this.handleError<Okr>(`getOkr id=${id}`))
      );
  }

  /**GET Okr by id. Will return 404 when not found */
  getOkr(id: string): Observable<Okr> {
    const url = `${this.okrsUrl}/${id}`;
    return this.http.get<Okr>(url,
      {
        headers: {
          Authorization: `Bearer ${this.auth.getToken()}`
        }
      }
    ).pipe(
      tap(_ => console.log(`fetched Okr w id=${id}`)),
      catchError(this.handleError<Okr>(`getOkr id=${id}`))
    );
  }

  /**GET okrs whose objective contains search term */
  searchOkrs(term: string): Observable<{}> {
    if (!term.trim()) {
      //if not search term, return empty OKR array
      return of([]);
    }
    return this.http.get<{}>(`${this.okrsUrl}/objective/${term}`,
      {
        headers: {
          Authorization: `Bearer ${this.auth.getToken()}`
        }
      }
    ).pipe(
      tap(_ => console.log(`found OKRs matching "${term}"`)),
      catchError(this.handleError<{}>('searchOkrs', []))
    );
  }

  /**POST: add a new OKR to the server */
  createOkr(okr: Okr): Observable<Okr> {
    return this.http.post<Okr>(this.okrsUrl, okr,
      {
        headers: {
          Authorization: `Bearer ${this.auth.getToken()}`,
          'Content-Type': 'application/json'
        }
      }).pipe(
        tap((okr: Okr) => console.log(`added OKR with id=${okr._id}`)),
        catchError(this.handleError<Okr>('createOkr'))
      );
  }

  /**DELETE: delete the OKR from the server */
  deleteOkr(okr: Okr | string): Observable<Okr> {
    const id = typeof okr === 'string' ? okr : okr._id;
    const url = `${this.okrsUrl}/${id}`;

    return this.http.delete<Okr>(url, httpOptions).pipe(
      tap(_ => console.log(`deleted OKR w/ id=${id}`)),
      catchError(this.handleError<Okr>('deleteOkr'))
    );
  }

  /**PUT: update the OKR on the server */
  updateOkr(okr: Okr): Observable<any> {
    const id = typeof okr === 'string' ? okr : okr._id;

    return this.http.put(this.okrsUrl, okr, httpOptions).pipe(
      tap(_ => console.log(`updated OKR w/ id=${okr._id}`)),
      catchError(this.handleError<any>('updateOkr'))
    );
  }

  /**
   * Handle Http operation that failed
   * Let the app continue
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      //TODO: Send the error to remote logging infrastructure
      console.error(error);

      //TODO: Better job of transforming error for user consumption
      console.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result
      return of(result as T);
    };
  }
}
