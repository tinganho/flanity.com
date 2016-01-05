
module.exports = function(grunt) {
    grunt.initConfig({
        compass: {
            prod: {
                options: {
                    sassDir: 'Styles',
                    cssDir: 'Build/Public/Styles/',
                    environment: 'production',
                    noLineComments: true,
                    sourcemap: false,
                }
            },
            dev: {
                options: {
                    sassDir: 'Styles',
                    cssDir: 'Build/Public/Styles/',
                    noLineComments: true,
                    sourcemap: true,
                }
            }
        },
        watch: {
            compass: {
                files: ['**/*.scss'],
                tasks: ['compass:dev'],
            },
            scripts: {
                files: ['**/*.{ts,tsx}'],
                tasks: ['tsc'],
            },
            l10ns: {
                files: ['Localizations/*.json'],
                tasks: ['l10ns'],
            },
        },
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-compass');

    grunt.loadTasks('Tasks');
    grunt.registerTask('build:dev', ['clean-build', 'tsc', 'copy-public', 'l10ns', 'compass:dev']);
    grunt.registerTask('build', ['build:dev']);
    grunt.registerTask('test', ['build:dev', 'runtests']);
    grunt.registerTask('image', ['compile', 'docker-build']);
}