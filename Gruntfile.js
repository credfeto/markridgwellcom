// Load Grunt
module.exports = function (grunt) {

    const sass = require('node-sass');

    var maxInlineCssLength = 8192;

    // Build a multi task "files" object dynamically.
    function getBandImageFiles(srcdir, wildcard, sassfilename) {
        var path = require('path');
        var files = {};


        var index = 0;
        grunt.file.expand({cwd: srcdir}, wildcard).forEach(function(relpath) {

            console.log(relpath)
            var pos = relpath.indexOf('.');
            var displayName = relpath.substr(0, pos);
            displayName = displayName.replace(/^\d+\s/, '').replace(/\s\d+$/, '');

            files[index] = {
                source: path.join(srcdir, relpath),
                relPath: relpath,
                displayName: displayName
            };

            ++index;


        });

        var sassContent = '$imagelist: (\r\n';
        for( var i =0; i < index; ++i) {
            var filename = '../img/' + files[i].relPath;
            sassContent += '  (' + (+i+1) +', "' + filename + '"),\r\n';
        }
        sassContent += ')\r\n';

        grunt.file.write(sassfilename, sassContent);

        return files;
    }

    function getNamedFile(srcdir, wildcard, prefix) {
        var fileName = null;

        grunt.file.expand({cwd: srcdir}, wildcard).forEach(function(relpath) {

            fileName = prefix + '/' + relpath;
            return fileName;

        });


        return fileName;
    }

    function getInlineNamedFile(srcdir, wildcard, relativePath) {
        var fileName = getNamedFile(srcdir, wildcard, srcdir);
        if (fileName === null) {
            return null;
        }

        if (grunt.file.exists(fileName)) {
            var content = grunt.file.read(fileName);

            content = content.replace(/\.\.\//g, relativePath);

            if (content.length < maxInlineCssLength) {
                console.log('total Length: ' + content.length);
                console.log('Using inline content from ' + fileName + ' as it is less than ' + maxInlineCssLength + ' bytes');
                return content;
            }
        }

        return null;
    }

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),


        // Tasks
        clean: {
            dist: [
                'dst/static/css/*',
                'dst/static/img/*',
                'dst/static/js/*',
                'dst/static/*.html',
                'dst/static/*.txt',
                'tmp/css/auto/*',
                'tmp/css/min/*',
                'tmp/css/postsass/*',
                '.sass-cache/**'
            ]
        },

        sass: { // Begin Sass Plugin
            dist: {
                options: {
                    implementation: sass,
                    sourcemap: 'none'
                },
                files: [{
                    expand: true,
                    cwd: 'src/sass',
                    src: ['**/*.scss', '!*.generated.scss'],
                    dest: 'tmp/css/postsass',
                    ext: '.css'
                }]
            }
        },

        postcss: { // Begin Post CSS Plugin
            options: {
                map: false,
                processors: [
                    require('autoprefixer')({
                        browsers: ['last 2 versions']
                    })
                ]
            },
            dist: {
                src: 'tmp/css/postsass/site.css',
                dest: 'tmp/css/auto/site.css'
            }
        },

        dataUri: {
            dist: {
                // src file
                src: ['tmp/css/auto/*.css'],
                // output dir
                dest: 'tmp/css/datauri/',
                options: {
                    baseDir: 'src/css',

                    // specified files are only encoding
                    target: ['src/img/*.*'],
                    // adjust relative path?
                    fixDirLevel: true,
                    // img detecting base dir
                    //baseDir: '../img/',

                    // Do not inline any images larger
                    // than this size. 2048 is a size
                    // recommended by Google's mod_pagespeed.
                    maxBytes: 2048

                }
            }
        },

        cssmin: { // Begin CSS Minify Plugin
            options: {
                mergeIntoShorthands: true,
                level: 2,
                restructureRules: true
            },
            target: {
                files: [{
                    expand: true,
                    cwd: 'tmp/css/datauri/',
                    src: ['*.css', '!*.min.css'],
                    dest: 'tmp/css/min',
                    ext: '.css'
                }]
            }
        },


        uglify: { // Begin JS Uglify Plugin
            build: {
                src: ['src/*.js'],
                dest: 'dst/static/js/script.min.js'
            }
        },

        pug: {
            compile: {
                options: {
                    data: {
                        debug: false,
                        favicon: getNamedFile('dst/static/img', '*favicon.*.ico', 'img'),
                        css: getNamedFile('dst/static/css', '*site.*.css', 'css'),
                        inlinecss: getInlineNamedFile('dst/static/css', '*site.*.css', ''),
                        images: getBandImageFiles( 'dst/static/img', '**/*.jpg', 'src/sass/imagefiles.generated.scss')
                    }
                },
                files: {
                    'tmp/index.html': ['src/index.pug']
                }
            }
        },

        htmlmin: {                                     // Task
            dist: {                                      // Target
                options: {                                 // Target options
                    removeComments: true,
                    collapseWhitespace: true,
                    sortAttributes: true,
                    sortClassName: true
                },
                files: {                                   // Dictionary of files
                    'dst/static/index.html': 'tmp/index.html',     // 'destination': 'source'
                    'dst/static/contact.html': 'tmp/contact.html'
                }
            }
        },

        filerev: {
            options: {
                algorithm: 'sha512',
                length: 8
            },
            images: {
                src: 'src/img/**/*.{jpg,jpeg,gif,webp,ico}',
                dest: 'dst/static/img'
            },
            css: {
                src: 'tmp/css/min/**/*.css',
                dest: 'dst/static/css'
            }
        },

        copy: {
            main: {
                files: [
                    {expand: true, cwd: 'src/img/', src: ['**/*.png'], dest: 'dst/static/img'},

                    {expand: true, cwd: 'src/txt/', src: ['**/*.txt'], dest: 'dst/static/'}
                ]
            }
        },

        watch: { // Compile everything into one task with Watch Plugin
            all: {
                files: 'src/**/*.*',
                tasks: ['rebuild'],
                options: {
                    atBegin: true
                }
            }
        }
    });

    // Load Grunt plugins
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-postcss');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-filerev');
    grunt.loadNpmTasks('grunt-contrib-pug');
    grunt.loadNpmTasks('grunt-data-uri');

    // Register Grunt tasks
    grunt.registerTask('default', ['watch']);

    grunt.registerTask('rebuild', [
        'clean',
        'sass',
        'postcss',
        'sass',
        'dataUri',
        'cssmin',
        'copy',
        'filerev',
        'pug',
        'htmlmin',
        'sass',
        'postcss',
        'sass',
        'dataUri',
        'cssmin',
        'copy',
        'filerev',
        'pug',
        'htmlmin'
    ]);
};
