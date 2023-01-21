module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concurrent: {
      dev: ["ts", "nodemon", "watch"],
      options: {
        logConcurrentOutput: true
      }
    },
    ts: {
      default : {
        tsconfig: './tsconfig.json'
      }
    },
    watch: {
      scripts: {
        files: './src/**/*.ts',
        tasks: ['ts'],
        options: { nospawn: true }
      },
    },
    nodemon: {
      dev: {
        script: './pkg/annotator.js',
        options: {
            delay: 300,
            callback: function (nodemon) {
                nodemon.on('log', function (event) {
                    console.log(event.colour);
                });

                /** Open the application in a new browser window and is optional **/
                nodemon.on('config:update', function () {
                    // Delay before server listens on port
                    setTimeout(function() {
                        require('open')('http://localhost:8080');
                    }, 1000);
                });

                /** Update .rebooted to fire Live-Reload **/
                nodemon.on('restart', function () {
                    // Delay before server listens on port
                    setTimeout(function() {
                        console.log('Restart');
                    }, 1000);
            });
          }
        }
      },
    },
  });
  
  grunt.loadNpmTasks("grunt-concurrent")
  grunt.loadNpmTasks("grunt-nodemon");
  grunt.loadNpmTasks("grunt-ts")
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task(s).
  grunt.registerTask("run", ["concurrent:dev"]);

};