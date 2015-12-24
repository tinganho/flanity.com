
'use strict';

export class Gaussian {
    constructor(public mean: number, public standardDeviation: number) {
    }

    pdf(x: number) {
        let mean = this.standardDeviation * Math.sqrt(2 * Math.PI);
        let e = Math.exp(-Math.pow(x - this.mean, 2) / (2 * Math.pow(this.standardDeviation, 2)));
        return e / mean;
    }
}

export class DeferredCallback {
    private start: number;

    constructor(private time: number, private callback: (...args: any[]) => any) {
    }

    call(callback?: (...args: any[]) => any) {
        let now = Date.now();
        let diff = now - this.start;
        if (diff < this.time) {
            setTimeout(() => { this.callback(); callback(); }, this.time - diff);
        }
        else {
            this.callback();
            callback();
        }
    }
}
