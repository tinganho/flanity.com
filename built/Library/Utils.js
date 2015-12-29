'use strict';
var Gaussian = (function () {
    function Gaussian(mean, standardDeviation) {
        this.mean = mean;
        this.standardDeviation = standardDeviation;
    }
    Gaussian.prototype.pdf = function (x) {
        var mean = this.standardDeviation * Math.sqrt(2 * Math.PI);
        var e = Math.exp(-Math.pow(x - this.mean, 2) / (2 * Math.pow(this.standardDeviation, 2)));
        return e / mean;
    };
    return Gaussian;
}());
exports.Gaussian = Gaussian;
var DeferredCallback = (function () {
    function DeferredCallback(time, callback) {
        this.time = time;
        this.callback = callback;
        this.start = Date.now();
    }
    DeferredCallback.prototype.call = function (callback) {
        var _this = this;
        var now = Date.now();
        var diff = now - this.start;
        if (diff < this.time) {
            setTimeout(function () { _this.callback(); callback(); }, this.time - diff);
        }
        else {
            this.callback();
            callback();
        }
    };
    return DeferredCallback;
}());
exports.DeferredCallback = DeferredCallback;
function forEach(array, callback) {
    if (array) {
        for (var i = 0, len = array.length; i < len; i++) {
            var result = callback(array[i], i);
            if (result) {
                return result;
            }
        }
    }
    return undefined;
}
exports.forEach = forEach;
function createTextWriter(newLine) {
    var output = "";
    var indent = 0;
    var lineStart = true;
    var lineCount = 0;
    var linePos = 0;
    function write(s) {
        if (s && s.length) {
            if (lineStart) {
                output += getIndentString(indent);
                lineStart = false;
            }
            output += s;
        }
    }
    function rawWrite(s) {
        if (s !== undefined) {
            if (lineStart) {
                lineStart = false;
            }
            output += s;
        }
    }
    function writeLiteral(s) {
        if (s && s.length) {
            write(s);
            var lineStartsOfS = computeLineStarts(s);
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
        write: write,
        rawWrite: rawWrite,
        writeLiteral: writeLiteral,
        writeLine: writeLine,
        increaseIndent: function () { return indent++; },
        decreaseIndent: function () { return indent--; },
        getIndent: function () { return indent; },
        getTextPos: function () { return output.length; },
        getLine: function () { return lineCount + 1; },
        getColumn: function () { return lineStart ? indent * getIndentSize() + 1 : output.length - linePos + 1; },
        getText: function () { return output; },
    };
}
exports.createTextWriter = createTextWriter;
var indentStrings = ["", "    "];
function getIndentString(level) {
    if (indentStrings[level] === undefined) {
        indentStrings[level] = getIndentString(level - 1) + indentStrings[1];
    }
    return indentStrings[level];
}
function getIndentSize() {
    return indentStrings[1].length;
}
function computeLineStarts(text) {
    var result = new Array();
    var pos = 0;
    var lineStart = 0;
    while (pos < text.length) {
        var ch = text.charCodeAt(pos++);
        switch (ch) {
            case 13:
                if (text.charCodeAt(pos) === 10) {
                    pos++;
                }
            case 10:
                result.push(lineStart);
                lineStart = pos;
                break;
            default:
                if (ch > 127 && isLineBreak(ch)) {
                    result.push(lineStart);
                    lineStart = pos;
                }
                break;
        }
    }
    result.push(lineStart);
    return result;
}
function isLineBreak(ch) {
    return ch === 10 ||
        ch === 13 ||
        ch === 8232 ||
        ch === 8233;
}
exports.isLineBreak = isLineBreak;
function lastOrUndefined(array) {
    if (array.length === 0) {
        return undefined;
    }
    return array[array.length - 1];
}
exports.lastOrUndefined = lastOrUndefined;
var hasOwnProperty = Object.prototype.hasOwnProperty;
function hasProperty(map, key) {
    return hasOwnProperty.call(map, key);
}
exports.hasProperty = hasProperty;
function isArray(x) {
    return x instanceof Array;
}
exports.isArray = isArray;
function contains(array, value) {
    if (array) {
        for (var _i = 0, array_1 = array; _i < array_1.length; _i++) {
            var v = array_1[_i];
            if (v === value) {
                return true;
            }
        }
    }
    return false;
}
exports.contains = contains;
function map(array, f) {
    var result;
    if (array) {
        result = [];
        for (var _i = 0, array_2 = array; _i < array_2.length; _i++) {
            var v = array_2[_i];
            result.push(f(v));
        }
    }
    return result;
}
exports.map = map;
function extend(first, second) {
    var result = {};
    for (var id in first) {
        result[id] = first[id];
    }
    for (var id in second) {
        if (!hasProperty(result, id)) {
            result[id] = second[id];
        }
    }
    return result;
}
exports.extend = extend;
//# sourceMappingURL=Utils.js.map