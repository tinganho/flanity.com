
var ncp = require('ncp').ncp;

module.exports = function(grunt) {
    grunt.registerTask('copy-public', function() {
        var done = this.async();
        ncp('Public', 'Build/Public', function (err) {
            if (err) {
                return console.error(err);
            }
            done();
        });
    });
}