
import { CharacterCodes, Map } from './types';
import { sys } from './sys';
import 'terminal-colors';

export function computeLineStarts(text: string): number[] {
    let result: number[] = new Array();
    let pos = 0;
    let lineStart = 0;
    while (pos < text.length) {
       let ch = text.charCodeAt(pos++);
       switch (ch) {
            case CharacterCodes.carriageReturn:
                if (text.charCodeAt(pos) === CharacterCodes.lineFeed) {
                    pos++;
                }
            case CharacterCodes.lineFeed:
                result.push(lineStart);
                lineStart = pos;
                break;
            default:
                if (ch > CharacterCodes.maxAsciiCharacter && isLineBreak(ch)) {
                    result.push(lineStart);
                    lineStart = pos;
                }
                break;
        }
    }
    result.push(lineStart);
    return result;
}

export function isLineBreak(ch: number): boolean {
    // ES5 7.3:
    // The ECMAScript line terminator characters are listed in Table 3.
    //     Table 3: Line Terminator Characters
    //     Code Unit Value     Name                    Formal Name
    //     \u000A              Line Feed               <LF>
    //     \u000D              Carriage Return         <CR>
    //     \u2028              Line separator          <LS>
    //     \u2029              Paragraph separator     <PS>
    // Only the characters in Table 3 are treated as line terminators. Other new line or line
    // breaking characters are treated as white space but not as line terminators.

    return ch === CharacterCodes.lineFeed ||
        ch === CharacterCodes.carriageReturn ||
        ch === CharacterCodes.lineSeparator ||
        ch === CharacterCodes.paragraphSeparator;
}

/**
 * Returns the last element of an array if non-empty, undefined otherwise.
 */
export function lastOrUndefined<T>(array: T[]): T {
    if (array.length === 0) {
        return undefined;
    }

    return array[array.length - 1];
}

let indentStrings: string[] = ["", "    "];
export function getIndentString(level: number) {
    if (indentStrings[level] === undefined) {
        indentStrings[level] = getIndentString(level - 1) + indentStrings[1];
    }
    return indentStrings[level];
}

export function getIndentSize() {
    return indentStrings[1].length;
}

export interface EmitTextWriter {
    write(s: string): void;
    writeLine(): void;
    increaseIndent(): void;
    decreaseIndent(): void;
    getText(): string;
    rawWrite(s: string): void;
    writeLiteral(s: string): void;
    getTextPos(): number;
    getLine(): number;
    getColumn(): number;
    getIndent(): number;
}

export function createTextWriter(newLine: String): EmitTextWriter {
    let output = "";
    let indent = 0;
    let lineStart = true;
    let lineCount = 0;
    let linePos = 0;

    function write(s: string) {
        if (s && s.length) {
            if (lineStart) {
                output += getIndentString(indent);
                lineStart = false;
            }
            output += s;
        }
    }

    function rawWrite(s: string) {
        if (s !== undefined) {
            if (lineStart) {
                lineStart = false;
            }
            output += s;
        }
    }

    function writeLiteral(s: string) {
        if (s && s.length) {
            write(s);
            let lineStartsOfS = computeLineStarts(s);
            if (lineStartsOfS.length > 1) {
                lineCount = lineCount + lineStartsOfS.length - 1;
                linePos = output.length - s.length + lastOrUndefined(lineStartsOfS);
            }
        }
    }

    function writeLine() {
        if (!lineStart) {
            output += newLine;
            lineCount++;
            linePos = output.length;
            lineStart = true;
        }
    }

    return {
        write,
        rawWrite,
        writeLiteral,
        writeLine,
        increaseIndent: () => indent++,
        decreaseIndent: () => indent--,
        getIndent: () => indent,
        getTextPos: () => output.length,
        getLine: () => lineCount + 1,
        getColumn: () => lineStart ? indent * getIndentSize() + 1 : output.length - linePos + 1,
        getText: () => output,
    };
}

export let directorySeparator = "/";

// Returns length of path root (i.e. length of "/", "x:/", "//server/share/, file:///user/files")
export function getRootLength(path: string): number {
    if (path.charCodeAt(0) === CharacterCodes.slash) {
        if (path.charCodeAt(1) !== CharacterCodes.slash) return 1;
        let p1 = path.indexOf("/", 2);
        if (p1 < 0) return 2;
        let p2 = path.indexOf("/", p1 + 1);
        if (p2 < 0) return p1 + 1;
        return p2 + 1;
    }
    if (path.charCodeAt(1) === CharacterCodes.colon) {
        if (path.charCodeAt(2) === CharacterCodes.slash) return 3;
        return 2;
    }
    // Per RFC 1738 'file' URI schema has the shape file://<host>/<path>
    // if <host> is omitted then it is assumed that host value is 'localhost',
    // however slash after the omitted <host> is not removed.
    // file:///folder1/file1 - this is a correct URI
    // file://folder2/file2 - this is an incorrect URI
    if (path.lastIndexOf("file:///", 0) === 0) {
        return "file:///".length;
    }
    let idx = path.indexOf('://');
    if (idx !== -1) {
        return idx + "://".length;
    }
    return 0;
}

export function combinePaths(path1: string, path2: string) {
    if (!(path1 && path1.length)) return path2;
    if (!(path2 && path2.length)) return path1;
    if (getRootLength(path2) !== 0) return path2;
    if (path1.charAt(path1.length - 1) === directorySeparator) return path1 + path2;
    return path1 + directorySeparator + path2;
}

export interface StringSet extends Map<any> { }

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

export function indexOf<T>(array: T[], value: T): number {
    if (array) {
        for (let i = 0, len = array.length; i < len; i++) {
            if (array[i] === value) {
                return i;
            }
        }
    }
    return -1;
}

export function countWhere<T>(array: T[], predicate: (x: T) => boolean): number {
    let count = 0;
    if (array) {
        for (let v of array) {
            if (predicate(v)) {
                count++;
            }
        }
    }
    return count;
}

export function filter<T>(array: T[], f: (x: T) => boolean): T[]{
    let result: T[];
    if (array) {
        result = [];
        for (let item of array) {
            if (f(item)) {
                result.push(item);
            }
        }
    }
    return result;
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

export function concatenate<T>(array1: T[], array2: T[]): T[] {
    if (!array2 || !array2.length) return array1;
    if (!array1 || !array1.length) return array2;

    return array1.concat(array2);
}

export function deduplicate<T>(array: T[]): T[]{
    let result: T[];
    if (array) {
        result = [];
        for (let item of array) {
            if (!contains(result, item)) {
                result.push(item);
            }
        }
    }
    return result;
}

export function sum(array: any[], prop: string): number {
    let result = 0;
    for (let v of array) {
        result += v[prop];
    }
    return result;
}

export function addRange<T>(to: T[], from: T[]): void {
    if (to && from) {
        for (let v of from) {
            to.push(v);
        }
    }
}

export function rangeEquals<T>(array1: T[], array2: T[], pos: number, end: number) {
    while (pos < end) {
        if (array1[pos] !== array2[pos]) {
            return false;
        }
        pos++;
    }
    return true;
}

export function fileExtensionIs(path: string, extension: string): boolean {
    let pathLen = path.length;
    let extLen = extension.length;
    return pathLen > extLen && path.substr(pathLen - extLen, extLen) === extension;
}

export function includes<T>(arr: T[], search: T): boolean {
    return arr.indexOf(search) !== -1;
}

export function printError(err: Error): void {
    console.log(err.message);
    console.log((err as any).stack);
}

let hasOwnProperty = Object.prototype.hasOwnProperty;
export function hasProperty<T>(map: Map<T>, key: string): boolean {
    return hasOwnProperty.call(map, key);
}