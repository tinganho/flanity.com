
'use strict';

var spawn = require('child_process').spawn;

module.exports = function(grunt) {
    grunt.registerTask('start-server', function() {
        var done = this.async();

        var env = process.env;

        var cmd = 'node';
        var options = [
            'Build/Start.js'
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
                return grunt.fail.warn('Starting server failed', code);
            }
            if (hasError) {
                return grunt.fail.warn('Starting server failed', 1);
            }
            console.log('child process exited with code ' + code);
            done();
        });
    });
}