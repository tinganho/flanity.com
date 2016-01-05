
'use strict';

var spawn = require('child_process').spawn;

module.exports = function(grunt) {
    grunt.registerTask('runtests', function() {
        var done = this.async();

        var env = process.env;
        env.IN_IMAGE_TEST = true;

        var cmd = './node_modules/mocha/bin/mocha';
        var options = ['./Build/TestHarness/Runner.js', '--reporter', 'dot', '--timeout', '300000', '--colors', '--full-trace'];

        if (grunt.option('grep')) {
            options.push('--grep');
            options.push(grunt.option('grep'));
        }

        if (grunt.option('webdriver-target')) {
            env.WEBDRIVER_TARGET = grunt.option('webdriver-target');
        }

        if (grunt.option('no-quiet')) {
            env.NO_QUIET = true;
        }

        if (grunt.option('no-test-retries')) {
            env.NO_TEST_RETRIES = true;
        }

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
                return grunt.fail.warn('Test failed', code);
            }
            if (hasError) {
                return grunt.fail.warn('Test failed', 1);
            }
            console.log('child process exited with code ' + code);
            done();
        });
    });
}