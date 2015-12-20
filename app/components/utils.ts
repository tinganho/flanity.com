export interface Map<T> {
    [index: string]: T;
}

let hasOwnProperty = Object.prototype.hasOwnProperty;

export function hasProperty<T>(map: Map<T>, key: string): boolean {
    return hasOwnProperty.call(map, key);
}

export function isArray<T>(x: any): x is T {
    return x instanceof Array;
}

/**
 * Iterates through 'array' by index and performs the callback on each element of array until the callback
 * returns a truthy value, then returns that value.
 * If no such value is found, the callback is applied to each element of array and undefined is returned.
 */
export function forEach<T, U>(array: T[], callback: (element: T, index: number) => U): U {
    if (array) {
        for (let i = 0, len = array.length; i < len; i++) {
            let result = callback(array[i], i);
            if (result) {
                return result;
            }
        }
    }
    return undefined;
}

export function contains<T>(array: T[], value: T): boolean {
    if (array) {
        for (let v of array) {
            if (v === value) {
                return true;
            }
        }
    }
    return false;
}

export function map<T, U>(array: T[], f: (x: T) => U): U[]{
    let result: U[];
    if (array) {
        result = [];
        for (let v of array) {
            result.push(f(v));
        }
    }
    return result;
}

export function extend<T>(first: Map<T>, second: Map<T>): Map<T> {
    let result: Map<T> = {};
    for (let id in first) {
        result[id] = first[id];
    }
    for (let id in second) {
        if (!hasProperty(result, id)) {
            result[id] = second[id];
        }
    }
    return result;
}