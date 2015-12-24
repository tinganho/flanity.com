/// <reference path="typings/node/node.d.ts"/>

var gulp = require('gulp');
var rename = require('gulp-rename');
var path = require('path');
var fs = require('fs');
var mochaPhantomJs = require('gulp-mocha-phantomjs');
var open = require('open');
var cp = require('child_process');
var es = require('event-stream');
var clean = require('gulp-rimraf');
var compass = require('gulp-compass');
var path = require('path');
var Builder = require('systemjs-builder');
var rev = require('gulp-rev');
var browserify = require('gulp-browserify');
var revReplace = require('gulp-rev-replace');
var uglify = require('gulp-uglify');
var filter = require('gulp-filter');
var csso = require('gulp-csso');

var spawn = cp.spawn;
var exec = cp.exec;

gulp.task('bundle', ['tsc:dist'], function(next) {
    var server = require('./built/app/server.js');
    server.emitClientFiles();

    var builder = new Builder({
        baseURL: 'built/app'
    });

    builder.loadConfig('built/app/public/scripts/startup.js')
        .then(function() {
            builder.config({
                baseURL: 'built/app'
            });
            return builder.buildSFX('public/scripts/bindings.js', 'built/app/public/scripts/app.js', { runtime: false });
        })
        .then(function() {
            next();
        })
        .catch(function(err) {
            if (err instanceof Error) {
                console.log(err.message);
                console.log(err.stack);
            }
            else {
                console.log(err);
            }
        });
});

gulp.task('clean', function() {
    var cleanLocalStream = gulp.src('dist', { read: false })
        .pipe(clean());

    var cleanDistStream = gulp.src('built', { read: false })
        .pipe(clean());

    return es.concat(cleanLocalStream, cleanDistStream);
});

var compassOptions = {
    project: __dirname,
    css: 'built/app/public/styles',
    sass: 'app',
    bundle_exec: true,
    source_map: true,
    image: 'app/public/styles/images'
}

gulp.task('compass:compile:dev', function() {
    return gulp.src('app/styles.scss', { base: __dirname })
        .pipe(compass(compassOptions));
});

gulp.task('compass:compile:dist', function() {
    var options = compassOptions;
    options.source_map = false;

    return gulp.src('app/styles.scss', { base: __dirname })
        .pipe(compass(compassOptions));
});

var tscCommand = 'tsc';
tscCommand += ' --noImplicitAny';
tscCommand += ' --outDir built';
tscCommand += ' --experimentalDecorators';
tscCommand += ' --target es5';
tscCommand += ' --rootDir .';
tscCommand += ' --jsx react';
tscCommand += ' --removeComments';

gulp.task('tsc:dev', function(next) {
    var command = tscCommand;
    command += ' --inlineSources';
    console.log(command);
    exec(command, function(err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);

        var server = require('./built/app/server.js');
        server.emitClientFiles();
        next(err);
    });
});

gulp.task('tsc:watch', function() {
    gulp.watch('app/**/*.{ts,tsx}', function() {
        exec(tscCommand + ' -w', function(err, stdout, stderr) {
            console.log(stdout);
            console.log(stderr);
        });
    });
});

gulp.task('tsc:dist', ['compile-l10ns', 'copy-public'], function(next) {
    exec(tscCommand, function(err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        next(err);
    });
});

gulp.task('copy-public', function() {
    return gulp.src('app/public/**/*')
        .pipe(gulp.dest('built/app/public'));
});

gulp.task('image-tests', ['tsc:dev'], function(next) {
    var cmdEmitter = spawn('node_modules/mocha/bin/mocha',
        [
            'built/app/harness/runner.js',
            '--reporter', 'spec',
            '--timeout', '10000', '--full-trace'
        ].concat(process.argv.slice(6)), { env: process.env });

        var hasError = false;
        cmdEmitter.stdout.on('data', function (data) {
            process.stdout.write(data.toString());
        });
        cmdEmitter.stderr.on('data', function (data) {
            process.stderr.write(data.toString());
        });
        cmdEmitter.on('exit', function (code) {
            console.log('child process exited with code ' + code);
            next();
        });
});

gulp.task('selenium-server', function(next) {
    exec('java -jar bin/selenium-server.jar -Dwebdriver.chrome.driver=bin/chromedriver');
    console.log('Selenium server started. Press CTRL + C to close it.');
});

gulp.task('accept-baselines', function() {
    var cleanStream = gulp.src('test/baselines/reference')
        .pipe(clean());

    var copyStream = gulp.src('test/baselines/local/**/*', { base: 'test/baselines/local' })
        .pipe(gulp.dest('test/baselines/reference'));

    return es.concat(cleanStream, copyStream);
});
gulp.task('ab', ['accept-baselines']);

gulp.task('compile-l10ns', function(next) {
    exec('l10ns compile', function(err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        next(err);
    });
});

gulp.task('watch', function() {
    gulp.watch('app/public/scripts/localizations/*.js', ['copy-public']);
    gulp.watch('app/**/*.{ts,tsx}', ['tsc:dev']);
    gulp.watch('app/**/*.scss', ['compass:compile:dev']);
});

gulp.task('rev', ['bundle'], function() {
    var jsFilter = filter('**/*.js', { restore: true });
    var cssFilter = filter('**/*.css', { restore: true });

    return gulp.src('built/app/public/**/*')
        .pipe(jsFilter)
        .pipe(uglify({ mangle: false }))
        .pipe(jsFilter.restore)
        .pipe(cssFilter)
        .pipe(csso())
        .pipe(cssFilter.restore)
        .pipe(rev())
        .pipe(revReplace())
        .pipe(gulp.dest('built/app/public'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('built/app/public'));
});

gulp.task('dist', ['rev'], function() {
    var manifest = gulp.src('built/app/public/rev-manifest.json');

    // Revision replace all server files.
    return gulp.src('built/app/**/*.js')
        .pipe(revReplace({ manifest: manifest }))
        .pipe(gulp.dest('built/app/'));
});

gulp.task('default', ['generate-diagnostics']);