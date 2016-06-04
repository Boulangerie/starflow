module.exports = function (grunt) {
  'use strict';

  grunt.loadNpmTasks('grunt-bump');

  grunt.initConfig({

      bump: {
        options: {
          pushTo: 'origin'
        }
      }

  });

};
