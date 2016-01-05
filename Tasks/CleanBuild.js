
'use strict';

var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');
var remove = require('remove');

module.exports = function(grunt) {
    grunt.registerTask('clean-build', function() {
        var buildDir = path.join(__dirname, '../Build');
        if (fs.existsSync(buildDir)) {
            remove.removeSync(buildDir);
        }
    })
}