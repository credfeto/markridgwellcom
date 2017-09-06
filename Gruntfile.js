// Load Grunt
module.exports = function (grunt) {
    // Build a multi task "files" object dynamically.
    function getBandImageFiles(srcdir, wildcard, sassfilename) {
        var path = require('path');
        var files = {};


        index = 0;
        grunt.file.expand({cwd: srcdir}, wildcard).forEach(function(relpath) {

            pos = relpath.indexOf('.');
            displayName = relpath.substr(0, pos);
            displayName = displayName.replace(/^\d+\s/, '').replace(/\s\d+$/, '');

            files[index] = {
                source: path.join(srcdir, relpath),
                relpath: relpath,
                displayName: displayName
            };

            ++index;


        });

        var sassContent = '$imagelist: (\r\n';
        for( var i =0; i < index; ++i) {

            //console.log(prefix);
            var filename = '../img/' + files[i].relpath;
            console.log(filename);

            sassContent += '  (' + (+i+1) +', "' + filename + '"),\r\n';
        }
        sassContent += ')\r\n';

        grunt.file.write(sassfilename, sassContent);

        return files;
    }

    function getNamedFile(srcdir, wildcard, prefix) {
        var path = require('path');
        var files = {};

        cssFile = '';

        grunt.file.expand({cwd: srcdir}, wildcard).forEach(function(relpath) {

            cssFile = prefix + '/' + relpath;
            return cssFile;

        });


        return cssFile;
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
        cssmin: { // Begin CSS Minify Plugin
            options: {
                mergeIntoShorthands: true,
                level: 2,
                restructureRules: true
            },
            target: {
                files: [{
                    expand: true,
                    cwd: 'tmp/css/auto',
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
        watch: { // Compile everything into one task with Watch Plugin
            sass: {
                files: 'src/**/*.scss',
                tasks: ['clean', 'pug', 'sass', 'postcss', 'cssmin', 'filerev'],
                options: {
                    atBegin: true
                }
            },

            postcss: {
                files: 'tmp/css/postsass/*.css',
                tasks: ['postcss'],
                options: {
                    atBegin: true
                }
            },

            cssmin: {
                files: 'tmp/css/auto/*.css',
                tasks: ['cssmin'],
                options: {
                    atBegin: true
                }
            },

            cssfilerev: {
                files: 'tmp/css/min/*.css',
                tasks: ['filerev'],
                options: {
                    atBegin: true
                }
            },

            js: {
                files: 'src/**/*.js',
                tasks: ['uglify'],
                options: {
                    atBegin: true
                }
            },

            pug: {
                files: 'src/**/*.pug',
                tasks: ['pug', 'htmlmin'],
                options: {
                    atBegin: true
                }
            },

            html: {
                files: 'src/html/**/*.html',
                tasks: ['htmlmin'],
                options: {
                    atBegin: true
                }
            },

          bandimages: {
            files: 'src/**/*.jpg',
            tasks: [ 'filerev', 'pug'],
              options: {
                  atBegin: true
              }
            },

            favicon: {
                files: 'src/**/*.ico',
                tasks: [ 'filerev' ],
                options: {
                    atBegin: true
                }
            },

            png: {
                files: 'src/**/*.png',
                tasks: [ 'copy' ],
                options: {
                    atBegin: true
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
        }
    });

    // Load Grunt plugins
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-postcss');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-filerev');
    grunt.loadNpmTasks('grunt-contrib-pug');

    // Register Grunt tasks
    grunt.registerTask('default', ['clean', 'filerev', 'watch']);
};
