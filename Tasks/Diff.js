
var exec = require('child_process').exec;
var remove = require('remove');
var path = require('path');
var fs = require('fs');

module.exports = function(grunt) {
    grunt.registerTask('diff', function() {
        var done = this.async();

        if (!process.env.DIFF) {
            grunt.log.error(['You have not defined your diff tool yet.']);
        }

        var currentBaseline = path.join(__dirname, '../Tests/Baselines/Current');
        var referenceBaseline = path.join(__dirname, '../Tests/Baselines/Reference');

        var cmd = process.env.DIFF + ' ' + referenceBaseline + ' ' + currentBaseline;

        exec(cmd, function(err, stdout, stderr) {
            console.log(stdout);
            done();
        });
    });
}