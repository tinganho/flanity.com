"use strict";
var Debug;
(function (Debug) {
    var styles = {
        bold: ['\x1B[1m', '\x1B[22m'],
        italic: ['\x1B[3m', '\x1B[23m'],
        underline: ['\x1B[4m', '\x1B[24m'],
        inverse: ['\x1B[7m', '\x1B[27m'],
        strikethrough: ['\x1B[9m', '\x1B[29m'],
        white: ['\x1B[37m', '\x1B[39m'],
        lightWhite: ['\x1B[97m', '\x1B[39m'],
        black: ['\x1B[30m', '\x1B[39m'],
        lightBlack: ['\x1B[90m', '\x1B[39m'],
        blue: ['\x1B[34m', '\x1B[39m'],
        lightBlue: ['\x1B[94m', '\x1B[39m'],
        cyan: ['\x1B[36m', '\x1B[39m'],
        lightCyan: ['\x1B[96m', '\x1B[39m'],
        green: ['\x1B[32m', '\x1B[39m'],
        lightGreen: ['\x1B[92m', '\x1B[39m'],
        magenta: ['\x1B[35m', '\x1B[39m'],
        lightMagenta: ['\x1B[95m', '\x1B[39m'],
        red: ['\x1B[31m', '\x1B[39m'],
        lightRed: ['\x1B[91m', '\x1B[39m'],
        yellow: ['\x1B[33m', '\x1B[39m'],
        lightYellow: ['\x1B[93m', '\x1B[39m'],
        whiteBg: ['\x1B[47m', '\x1B[49m'],
        lightWhiteBg: ['\x1B[107m', '\x1B[49m'],
        blackBg: ['\x1B[40m', '\x1B[49m'],
        lightBlackBg: ['\x1B[100m', '\x1B[49m'],
        blueBg: ['\x1B[44m', '\x1B[49m'],
        lightBlueBg: ['\x1B[104m', '\x1B[49m'],
        cyanBg: ['\x1B[46m', '\x1B[49m'],
        lightCyanBg: ['\x1B[106m', '\x1B[49m'],
        greenBg: ['\x1B[42m', '\x1B[49m'],
        lightGreenBg: ['\x1B[106m', '\x1B[49m'],
        magentaBg: ['\x1B[45m', '\x1B[49m'],
        lightMagentaBg: ['\x1B[105m', '\x1B[49m'],
        redBg: ['\x1B[41m', '\x1B[49m'],
        lightRedBg: ['\x1B[101m', '\x1B[49m'],
        yellowBg: ['\x1B[43m', '\x1B[49m'],
        lightYellowBg: ['\x1B[103m', '\x1B[49m'],
    };
    function color(text, style) {
        if (typeof __dirname === 'undefined')
            return text;
        return styles[style][0] + text + styles[style][1];
    }
    ;
    Debug.level = 0;
    var levelToCategoryString = {
        0: color('Message', 'green'),
        1: color('Error', 'red'),
        2: color('Warning', 'yellow'),
        3: color('Log', 'magenta'),
    };
    function setLevel(l) {
        Debug.level = l;
    }
    Debug.setLevel = setLevel;
    function interpolateMessage(message, arg0, arg1, arg2) {
        return message = message
            .replace('{0}', arg0)
            .replace('{1}', arg1)
            .replace('{2}', arg2);
    }
    function print(type, message, arg0, arg1, arg2) {
        message = interpolateMessage(message, arg0, arg1, arg2);
        var category = levelToCategoryString[Debug.level];
        var preText = "[ " + category + " ] - ";
        var preTextColumns = preText.length;
        var stdoutColumns = process.stdout.columns;
        var stdoutText = preText + message;
        var columnIndex = 0;
        for (var i = 0; i < stdoutText.length; i++) {
            process.stdout.write(stdoutText[i]);
            columnIndex++;
            if (columnIndex >= stdoutColumns - 1) {
                process.stdout.write('\n');
                var spaces = '';
                for (var y = 0; y < preTextColumns; y++) {
                    spaces += ' ';
                }
                process.stdout.write(spaces);
                columnIndex = 0;
            }
        }
        process.stdout.write('\n');
    }
    function error(message, arg0, arg1, arg2) {
        if (Debug.level >= 0) {
            if (typeof arg0 === 'undefined') {
                throw Error(message);
            }
            if (typeof arg0 === 'string') {
                throw Error(interpolateMessage(message, arg0, arg1, arg2));
            }
            else {
                print(1, message);
                throw arg0;
            }
        }
    }
    Debug.error = error;
    function warn(message, arg0, arg1, arg2) {
        if (Debug.level >= 1) {
            print(2, message, arg0, arg1, arg2);
        }
    }
    Debug.warn = warn;
    function log(message, arg0, arg1, arg2) {
        if (Debug.level >= 2) {
            print(3, message, arg0, arg1, arg2);
        }
    }
    Debug.log = log;
    function debug(text, name) {
        var debugText = "----------- " + (name || 'DEBUG') + " -------------";
        console.log(debugText);
        console.log(text);
        console.log(debugText);
    }
    Debug.debug = debug;
    function printError(err) {
        console.log(err.message);
        console.log(err.stack);
    }
    Debug.printError = printError;
    function prompt(message) {
        print(0, message);
    }
    Debug.prompt = prompt;
})(Debug = exports.Debug || (exports.Debug = {}));
//# sourceMappingURL=Debug.js.map