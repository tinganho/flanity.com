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
        baseURL: 'Build/'
    });

    builder.loadConfig('Build/Public/Scripts/Startup.js')
        .then(function() {
            builder.config({
                baseURL: 'Build/'
            });
            return builder.buildSFX('Public/Scripts/Bindings.js', 'Build/Public/Scripts/App.js', { runtime: false });
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

    var cleanDistStream = gulp.src('Build', { read: false })
        .pipe(clean());

    return es.concat(cleanLocalStream, cleanDistStream);
});

var compassOptions = {
    project: __dirname,
    css: 'Build/Public/Styles/',
    sass: 'Styles/',
    bundle_exec: true,
    source_map: true,
    image: 'Public/Styles/Images/'
}

gulp.task('compass:compile:dev', function() {
    return gulp.src('Styles/Index.scss', { base: __dirname })
        .pipe(compass(compassOptions));
});

gulp.task('compass:compile:dist', function() {
    var options = compassOptions;
    options.source_map = false;

    return gulp.src('Styles/Index.scss', { base: __dirname })
        .pipe(compass(compassOptions));
});

var tscCommand = 'tsc';
tscCommand += ' --noImplicitAny';
tscCommand += ' --outDir Build';
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

        var server = require('./Build/Server.js');
        server.emitClientFiles();
        next(err);
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
    return gulp.src('Public/**/*')
        .pipe(gulp.dest('Build/Public/'));
});

gulp.task('copy-l10ns', function() {
    return gulp.src('Public/Scripts/Localizations/**/*')
        .pipe(gulp.dest('Build/Public/Scripts/Localizations/'));
});

gulp.task('image-tests', ['tsc:dev'], function(next) {
    var cmdEmitter = spawn('node_modules/mocha/bin/mocha',
        [
            'Build/Application/Harness/Runner.js',
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
    gulp.watch('Public/Scripts/Localizations/*.js', ['copy-l10ns']);
    gulp.watch('**/*.{ts,tsx}', ['tsc:dev', 'copy-public']);
    gulp.watch('**/*.scss', ['compass:compile:dev']);
});

gulp.task('rev', ['bundle'], function() {
    var jsFilter = filter('**/*.js', { restore: true });
    var cssFilter = filter('**/*.css', { restore: true });

    return gulp.src('Build/Public/**/*')
        .pipe(jsFilter)
        .pipe(uglify({ mangle: false }))
        .pipe(jsFilter.restore)
        .pipe(cssFilter)
        .pipe(csso())
        .pipe(cssFilter.restore)
        .pipe(rev())
        .pipe(revReplace())
        .pipe(gulp.dest('Build/Public'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('Build/Public'));
});

gulp.task('dist', ['rev'], function() {
    var manifest = gulp.src('Build/Public/rev-manifest.json');

    // Revision replace all server files.
    return gulp.src('Build/**/*.js')
        .pipe(revReplace({ manifest: manifest }))
        .pipe(gulp.dest('Build/'));
});

gulp.task('default', ['generate-diagnostics']);