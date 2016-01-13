
var fs = require('fs');
var path = require('path');
var remove = require('remove');

module.exports = function(grunt) {
    grunt.registerTask('accept-baseline', function() {
        var referencePath = path.join(__dirname, '../Tests/Baselines/Reference');
        var currentPath = path.join(__dirname, '../Tests/Baselines/Current');

        if (!fs.existsSync(currentPath)) {
            return grunt.log.error(['You do not have a current baseline.']);
        }
        if (fs.existsSync(referencePath)) {
            remove.removeSync(referencePath);
        }
        fs.renameSync(currentPath, referencePath);
    });
}