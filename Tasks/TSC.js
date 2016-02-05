
'use strict';

var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');
var remove = require('remove');

module.exports = function(grunt) {
    grunt.registerTask('tsc', function() {
        var done = this.async();

        var env = process.env;

        var cmd = 'tsc';
        var options = [
            '--noImplicitAny',
            '--outDir', 'Build',
            '--experimentalDecorators',
            '--target', 'es5',
            '--rootDir', '.',
            '--jsx', 'react',
            '--removeComments',
            // '--inlineSourceMap',
        ];

        console.log(cmd, options.join(' '));

        var cmdEmitter = spawn(cmd, options, { env: env });
        var hasError = false;
        cmdEmitter.stdout.on('data', function (data) {
            process.stdout.write(data.toString());
        });
        cmdEmitter.stderr.on('data', function (data) {
            hasError = true;
            process.stderr.write('error: ' + data.toString());
        });
        cmdEmitter.on('exit', function (code) {
            if (code !== 0) {
                return grunt.fail.warn('Compilation failed', code);
            }
            if (hasError) {
                return grunt.fail.warn('Compilation failed', 1);
            }
            console.log('child process exited with code ' + code);
            done();
        });
    });
}