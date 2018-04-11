/*
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { Component, Input, OnInit, NgZone } from '@angular/core';
import { Spinkit } from '../../spinkits';
import { PendingInterceptorService } from '../../services/pending-interceptor.service';
import { SpinnerVisibilityService } from '../../services/spinner-visibility.service';
import { Observable } from 'rxjs/Observable';
import { debounceTime, merge, tap } from 'rxjs/operators';

@Component({
    selector: 'spinner',
    templateUrl: './spinner.component.html',
    styleUrls: ['./spinner.component.css']
})
export class SpinnerComponent implements OnInit {
    public isSpinnerVisible$: Observable<boolean>;

    public Spinkit = Spinkit;
    @Input()
    public backgroundColor: string;
    @Input()
    public spinner = Spinkit.skCubeGrid;
    @Input()
    public filteredUrlPatterns: string[] = [];
    @Input()
    public debounceDelay = 0;
    @Input()
    public entryComponent: any = null;

    constructor(
        private pendingInterceptorService: PendingInterceptorService,
        private spinnerVisibilityService: SpinnerVisibilityService
    ) {
        this.isSpinnerVisible$ = this.pendingInterceptorService
            .pendingRequestsStatus
            .pipe(
                merge(this.spinnerVisibilityService
                    .visibilityObservable),
                debounceTime(this.debounceDelay),
        );
    }

    ngOnInit(): void {
        this.nullifySpinnerIfComponentOutletIsDefined();

        if (!(this.filteredUrlPatterns instanceof Array)) {
            throw new TypeError('`filteredUrlPatterns` must be an array.');
        }

        if (!!this.filteredUrlPatterns.length) {
            this.filteredUrlPatterns.forEach(e => {
                this.pendingInterceptorService.filteredUrlPatterns.push(new RegExp(e));
            });
        }
    }

    private nullifySpinnerIfComponentOutletIsDefined(): void {
        if (null != this.entryComponent) {
            this.spinner = null;
        }
    }

}
