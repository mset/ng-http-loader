/*
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { Injectable, NgZone } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';

import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { catchError, finalize, map, distinctUntilChanged } from 'rxjs/operators';
import { _throw } from 'rxjs/observable/throw';


@Injectable()
export class PendingInterceptorService implements HttpInterceptor {
    private _pendingRequests = 0;
    private _existingPendingRequestsEmitted = true;
    private _pendingRequestsStatus: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);
    private _filteredUrlPatterns: RegExp[] = [];

    pendingRequestsStatus: Observable<boolean>;


    constructor(public _ngZone: NgZone) {
        this.pendingRequestsStatus = this._pendingRequestsStatus.asObservable()
            .pipe(
                distinctUntilChanged()
            );
    }


    get pendingRequests(): number {
        return this._pendingRequests;
    }

    get filteredUrlPatterns(): RegExp[] {
        return this._filteredUrlPatterns;
    }

    private shouldBypass(url: string): boolean {
        return this._filteredUrlPatterns.some(pattern => {
            return pattern.test(url);
        });
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        if (this.shouldBypass(req.urlWithParams)) {
            return next.handle(req);
        }

        this._pendingRequests++;
        // Emit the observable from inside the Zone as some requests may be invoked from outside the zone
        // and that would prevent Angular from detecting changes and showing the spinner correctly.
        this._ngZone.run(() => this._pendingRequestsStatus.next(true));
        this._pendingRequestsStatus.next(true);

        return next.handle(req).pipe(
            map(event => {
                return event;
            }),
            catchError(error => {
                return _throw(error);
            }),
            finalize(() => {
                this._pendingRequests--;

                if (0 === this._pendingRequests) {
                    this._existingPendingRequestsEmitted = false;
                    // Emit the observable from inside the Zone as some requests may be invoked from outside the zone
                    // and that would prevent Angular from detecting changes and showing the spinner correctly.
                    this._ngZone.run(() => this._pendingRequestsStatus.next(false));
                }
            })
        );
    }
}

export function PendingInterceptorServiceFactory(): PendingInterceptorService {
    return new PendingInterceptorService(new NgZone({}));
}

export let PendingInterceptorServiceFactoryProvider = {
    provide: PendingInterceptorService,
    useFactory: PendingInterceptorServiceFactory
};
